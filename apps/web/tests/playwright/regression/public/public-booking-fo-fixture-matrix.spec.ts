import { execFileSync } from "child_process";
import path from "path";

import { test, expect, type Page } from "@playwright/test";

const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";

/**
 * Legacy public-booking fixture ids (`seed:public-booking-fo-fixtures`).
 * Public scheduling prefers live `matchFOs` and drops these when other FOs match
 * (e.g. `fo_test_matrix15` cohort) — see `PublicBookingOrchestratorService`.
 */
const FO = {
  baseline: "cmoah8mu40003sauvkhrljzo7",
  limitedTravel: "cmoah8muh000dsauv5l5rrpwa",
  slotConstrained: "cmoah8mum000nsauv2z1rcov0",
  moveOnly: "cmoah8muq000xsauv7l7g2zj8",
} as const;

const FIXTURE_CUSTOMER_EMAIL = "public_booking_fixture_customer@servelink.test";
const apiRoot = path.resolve(process.cwd(), "../../services/api");

function bookingUrl(opts: {
  service: string;
  pubPath: string;
  locStreet: string;
  locCity: string;
  locState: string;
  locZip: string;
  step?: string;
}) {
  const q = new URLSearchParams();
  q.set("service", opts.service);
  q.set("pubPath", opts.pubPath);
  q.set("homeSize", "1500");
  q.set("bedrooms", "2");
  q.set("bathrooms", "2");
  q.set("locStreet", opts.locStreet);
  q.set("locCity", opts.locCity);
  q.set("locState", opts.locState);
  q.set("locZip", opts.locZip);
  if (opts.step) q.set("step", opts.step);
  return `/book?${q.toString()}`;
}

async function waitForReviewReady(
  page: import("@playwright/test").Page,
  opts?: { contactName?: string },
) {
  await expect(
    page.getByRole("heading", { name: /Review your direction/i }),
  ).toBeVisible({
    timeout: 60_000,
  });
  await page
    .locator("#booking-customer-name")
    .fill(opts?.contactName ?? "Fixture Matrix E2E");
  await page.locator("#booking-customer-email").fill(FIXTURE_CUSTOMER_EMAIL);

  const send = page.getByTestId("booking-direction-send");
  const oneVisit = page.getByTestId("booking-post-estimate-one_visit");
  const started = Date.now();
  while (Date.now() - started < 120_000) {
    if (await send.isEnabled().catch(() => false)) {
      await expect(send).toBeEnabled();
      return;
    }
    if (await oneVisit.isVisible().catch(() => false)) {
      await oneVisit.click();
    }
    await page.waitForTimeout(250);
  }
  throw new Error(
    "Review send stayed disabled — check live preview (estimate) and deep-clean visit choice for this service.",
  );
}

async function selectFirstAvailableTeam(page: Page) {
  const section = page.getByTestId("booking-schedule-team-section");

  await expect(section).toBeVisible({ timeout: 60000 });

  // Only target explicit team option containers
  const teamOptions = section.locator("[data-testid^='team-option']");

  await expect(teamOptions.first()).toBeVisible({ timeout: 60000 });

  // NO scroll — causes instability
  await teamOptions.first().click();

  await expect(page.getByTestId("booking-schedule-slot-section")).toBeVisible({
    timeout: 60000,
  });
}

async function submitReviewAndWaitForSchedule(
  page: import("@playwright/test").Page,
  opts?: { expectZeroTeams?: boolean },
) {
  const submit201 = page.waitForResponse(
    (r) =>
      r.url().includes("/booking-direction-intake/submit") &&
      r.request().method() === "POST" &&
      r.status() === 201,
    { timeout: 120_000 },
  );
  await page.getByRole("button", { name: /see available teams/i }).click();
  const response = await submit201;
  const submitJson = (await response.json()) as {
    bookingId?: string | null;
    bookingCreated?: boolean;
    bookingError?: { code?: string } | null;
  };
  expect(submitJson.bookingCreated, JSON.stringify(submitJson)).toBeTruthy();
  expect(submitJson.bookingError).toBeFalsy();
  const bookingId = String(submitJson.bookingId ?? "").trim();
  expect(bookingId.length).toBeGreaterThan(4);
  if (opts?.expectZeroTeams) {
    await expect(page.getByTestId("booking-schedule-zero-teams-fallback")).toBeVisible({
      timeout: 120_000,
    });
  } else {
    await expect(
      page.getByTestId("booking-schedule-team-section"),
    ).toBeVisible({ timeout: 15000 });
  }
  return { response, bookingId };
}

test.describe.configure({ mode: "serial", timeout: 240_000 });

test.describe("public booking — controlled FO fixture matrix (browser)", () => {
  test.beforeAll(async ({ request }) => {
    const apiOrigin =
      process.env.PLAYWRIGHT_NEST_API_ORIGIN || "http://127.0.0.1:3001";
    const res = await request.post(
      `${apiOrigin}/api/v1/booking-direction-intake/preview-estimate`,
      {
        data: {
          serviceId: "deep-cleaning",
          homeSize: "1500",
          bedrooms: "2",
          bathrooms: "2",
          pets: "",
          frequency: "One-Time",
          preferredTime: "Friday",
          serviceLocation: {
            street: "1 E 2nd St",
            city: "Tulsa",
            state: "OK",
            zip: "74103",
          },
        },
      },
    );
    const previewBody = await res.text();
    expect(
      res.ok(),
      `preview-estimate must return 200 (got ${res.status()}). API: SERVELINK_GEOCODE_MATRIX_FIXTURE_LOOKUP=true for matrix geocode; SERVELINK_E2E_RATE_LIMIT_BYPASS=true if preview hits RATE_LIMIT. Body: ${previewBody.slice(0, 400)}`,
    ).toBeTruthy();
  });
  test("1) core maintenance: teams + baseline slot + confirm; lat/lng in DB", async ({
    page,
  }) => {
    const teamPayloads: { teams?: { id: string }[] }[] = [];
    const submitBodies: unknown[] = [];

    page.on("request", (req) => {
      if (
        req.url().includes("/booking-direction-intake/submit") &&
        req.method() === "POST"
      ) {
        try {
          submitBodies.push(req.postDataJSON());
        } catch {
          /* ignore */
        }
      }
    });

    page.on("response", async (res) => {
      const u = res.url();
      if (u.includes("/public-booking/availability") && res.request().method() === "POST") {
        try {
          const j = (await res.json()) as { teams?: { id: string }[] };
          teamPayloads.push(j);
        } catch {
          /* ignore */
        }
      }
    });

    await page.goto(
      `${PLAYWRIGHT_BASE_URL}${bookingUrl({
        service: "deep-cleaning",
        pubPath: "one_time",
        locStreet: "1 E 2nd St",
        locCity: "Tulsa",
        locState: "OK",
        locZip: "74103",
        step: "review",
      })}`,
    );

    await waitForReviewReady(page);

    const { bookingId } = await submitReviewAndWaitForSchedule(page);

    await expect
      .poll(() =>
        teamPayloads.filter(
          (p) =>
            Array.isArray((p as { teams?: unknown }).teams) &&
            (p as { teams: unknown[] }).teams.length > 0,
        ).length,
      )
      .toBeGreaterThan(0);
    const teamOptions = teamPayloads.filter(
      (p) => Array.isArray((p as { teams?: unknown }).teams) && (p as { teams: unknown[] }).teams.length > 0,
    ) as { teams: { id: string }[] }[];
    const firstTeams = teamOptions[0];
    /** Deep-clean public team list is capped server-side at 3 when `fo_test_matrix15` is active. */
    expect(firstTeams?.teams?.length).toBe(3);
    const names = (firstTeams?.teams ?? []).map((t) =>
      String(
        (t as { displayName?: string; name?: string }).displayName ??
          (t as { name?: string }).name ??
          "",
      ),
    );
    expect(names.every((n) => /TEST FO/i.test(n))).toBeTruthy();
    expect(firstTeams?.teams?.some((t) => t.id === FO.moveOnly)).toBe(false);
    await expect(page.getByTestId("booking-schedule-team-section")).toBeVisible({
      timeout: 60_000,
    });
    await selectFirstAvailableTeam(page);

    await expect(page.getByTestId("booking-schedule-slot-section")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("booking-schedule-windows-loading")).toBeHidden({
      timeout: 120_000,
    });

    /** Slot grid only — the slot section also contains the confirm CTA button. */
    const slotButtons = page.locator(
      '[data-testid="booking-schedule-slot-section"] .mt-6.grid button[type="button"]',
    );
    await expect(slotButtons.first()).toBeVisible({ timeout: 60_000 });
    const slotCount = await slotButtons.count();
    expect(slotCount, "baseline should list at least one slot").toBeGreaterThan(0);

    const confirmBtn = page.getByTestId("booking-schedule-confirm-booking");
    /** Prefer later windows first — soonest slots can race with refreshes; hold can still reject stale UI. */
    const indices = [
      ...Array.from({ length: Math.min(12, slotCount) }, (_, k) => slotCount - 1 - k),
      ...Array.from({ length: slotCount }, (_, k) => k),
    ].filter((v, j, a) => a.indexOf(v) === j);
    let booked = false;
    for (const i of indices) {
      await slotButtons.nth(i).click();
      try {
        await expect(confirmBtn).toBeEnabled({ timeout: 12_000 });
      } catch {
        continue;
      }

      const holdP = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" && r.url().includes("/public-booking/hold"),
        { timeout: 120_000 },
      );
      const confirmP = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" && r.url().includes("/public-booking/confirm"),
        { timeout: 120_000 },
      );
      await confirmBtn.click();
      const holdResponse = await holdP;
      const holdBody = await holdResponse.text();
      if (
        holdResponse.status() === 400 &&
        holdBody.includes("PUBLIC_BOOKING_SLOT_NOT_AVAILABLE")
      ) {
        void confirmP.catch(() => {});
        continue;
      }
      if (
        holdResponse.status() === 409 &&
        holdBody.includes("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME")
      ) {
        void confirmP.catch(() => {});
        continue;
      }
      expect(
        holdResponse.ok(),
        `hold failed ${holdResponse.status()}: ${holdBody.slice(0, 500)}`,
      ).toBeTruthy();
      const confirmResponse = await confirmP;
      expect(
        confirmResponse.ok(),
        `confirm failed ${confirmResponse.status()}: ${(await confirmResponse.text()).slice(0, 500)}`,
      ).toBeTruthy();
      booked = true;
      break;
    }
    expect(booked, "expected hold+confirm to succeed for some listed slot").toBe(true);

    const submitBody = submitBodies[0] as { serviceLocation?: { street?: string } };
    expect(submitBody?.serviceLocation?.street).toMatch(/2nd/i);

    const siteJson = execFileSync(
      process.execPath,
      [path.join(apiRoot, "scripts/printBookingSiteJson.cjs"), bookingId],
      { encoding: "utf8", cwd: apiRoot, env: process.env },
    ).trim();
    const site = JSON.parse(siteJson) as { siteLat: unknown; siteLng: unknown };
    expect(typeof site.siteLat).toBe("number");
    expect(typeof site.siteLng).toBe("number");
    expect(Number.isFinite(site.siteLat as number)).toBe(true);
    expect(Number.isFinite(site.siteLng as number)).toBe(true);
  });

  test("2) slot counts: two selectable teams (two fresh flows)", async ({ page }) => {
    async function countSlotsAfterPickingFirstTeam(contactName: string): Promise<number> {
      await page.goto(
        `${PLAYWRIGHT_BASE_URL}${bookingUrl({
          service: "deep-cleaning",
          pubPath: "one_time",
          locStreet: "1 E 2nd St",
          locCity: "Tulsa",
          locState: "OK",
          locZip: "74103",
          step: "review",
        })}`,
      );
      await waitForReviewReady(page, {
        contactName,
      });
      await submitReviewAndWaitForSchedule(page);
      await expect(page.getByTestId("booking-schedule-team-section")).toBeVisible({
        timeout: 60_000,
      });
      await selectFirstAvailableTeam(page);
      await expect(page.getByTestId("booking-schedule-windows-loading")).toBeHidden({
        timeout: 120_000,
      });
      return page
        .locator(
          '[data-testid="booking-schedule-slot-section"] .mt-6.grid button[type="button"]',
        )
        .count();
    }

    const baselineWindows = await countSlotsAfterPickingFirstTeam("Slot count first flow");
    const altWindows = await countSlotsAfterPickingFirstTeam("Slot count second flow");

    expect(baselineWindows).toBeGreaterThan(0);
    expect(altWindows).toBeGreaterThan(0);
    expect(
      Math.max(baselineWindows, altWindows),
      "at least one FO should expose multiple slot buttons in the default range",
    ).toBeGreaterThan(1);
  });

  test("3) service type: move shows moveOnly; maintenance hides moveOnly", async ({
    page,
    request,
  }) => {
    async function teamIdsAfterSubmit(opts: {
      service: string;
      pubPath: string;
    }): Promise<string[]> {
      const ids: string[] = [];
      page.removeAllListeners("response");
      page.removeAllListeners("request");
      page.on("response", async (res) => {
        if (
          !res.url().includes("/public-booking/availability") ||
          res.request().method() !== "POST"
        ) {
          return;
        }
        try {
          const j = (await res.json()) as { teams?: { id: string }[] };
          if (Array.isArray(j.teams) && j.teams.length) {
            ids.push(...j.teams.map((t) => t.id));
          }
        } catch {
          /* ignore */
        }
      });

      await page.goto(
        `${PLAYWRIGHT_BASE_URL}${bookingUrl({
          service: opts.service,
          pubPath: opts.pubPath,
          locStreet: "1 E 2nd St",
          locCity: "Tulsa",
          locState: "OK",
          locZip: "74103",
          step: "review",
        })}`,
      );
      await waitForReviewReady(page, { contactName: "Service type probe" });
      await submitReviewAndWaitForSchedule(page);
      await page.waitForTimeout(2500);
      return [...new Set(ids)];
    }

    async function teamNamesAfterSubmit(opts: {
      service: string;
      pubPath: string;
    }): Promise<string[]> {
      const names: string[] = [];
      page.removeAllListeners("response");
      page.removeAllListeners("request");
      page.on("response", async (res) => {
        if (
          !res.url().includes("/public-booking/availability") ||
          res.request().method() !== "POST"
        ) {
          return;
        }
        try {
          const j = (await res.json()) as {
            teams?: { id: string; name?: string; displayName?: string }[];
          };
          if (Array.isArray(j.teams) && j.teams.length) {
            names.length = 0;
            names.push(
              ...j.teams.map((t) => String(t.name ?? t.displayName ?? "")),
            );
          }
        } catch {
          /* ignore */
        }
      });

      await page.goto(
        `${PLAYWRIGHT_BASE_URL}${bookingUrl({
          service: opts.service,
          pubPath: opts.pubPath,
          locStreet: "1 E 2nd St",
          locCity: "Tulsa",
          locState: "OK",
          locZip: "74103",
          step: "review",
        })}`,
      );
      await waitForReviewReady(page, { contactName: "Service type probe" });
      await submitReviewAndWaitForSchedule(page);
      await page.waitForTimeout(2500);
      return names;
    }

    const apiOrigin = process.env.PLAYWRIGHT_NEST_API_ORIGIN || "http://127.0.0.1:3001";
    const movePreview = await request.post(
      `${apiOrigin}/api/v1/booking-direction-intake/preview-estimate`,
      {
        data: {
          serviceId: "move-in-move-out",
          homeSize: "1500",
          bedrooms: "2",
          bathrooms: "2",
          pets: "",
          frequency: "One-Time",
          preferredTime: "Friday",
          serviceLocation: {
            street: "1 E 2nd St",
            city: "Tulsa",
            state: "OK",
            zip: "74103",
          },
        },
      },
    );
    const movePreviewBody = await movePreview.text();
    expect(
      movePreview.ok(),
      `move preview-estimate must return 200 (got ${movePreview.status()}). Body: ${movePreviewBody.slice(0, 400)}`,
    ).toBeTruthy();
    const moveNames = await teamNamesAfterSubmit({
      service: "move-in-move-out",
      pubPath: "move",
    });
    expect(
      moveNames.some((n) => /Move Only/i.test(n)),
      `expected a move-only-capable team in: ${moveNames.join(" | ")}`,
    ).toBeTruthy();

    const deepNames = await teamNamesAfterSubmit({
      service: "deep-cleaning",
      pubPath: "one_time",
    });
    expect(deepNames.some((n) => /Move Only/i.test(n))).toBe(false);
  });

  test("4) geography: edge address drops limitedTravel from team API", async ({ page }) => {
    const teams: string[] = [];
    page.on("response", async (res) => {
      if (
        !res.url().includes("/public-booking/availability") ||
        res.request().method() !== "POST"
      ) {
        return;
      }
      try {
        const j = (await res.json()) as { teams?: { id: string }[] };
        if (Array.isArray(j.teams)) teams.push(...j.teams.map((t) => t.id));
      } catch {
        /* ignore */
      }
    });

    await page.goto(
      `${PLAYWRIGHT_BASE_URL}${bookingUrl({
        service: "deep-cleaning",
        pubPath: "one_time",
        locStreet: "1919 N Florence Ave",
        locCity: "Tulsa",
        locState: "OK",
        locZip: "74110",
        step: "review",
      })}`,
    );
    await waitForReviewReady(page);
    await submitReviewAndWaitForSchedule(page);
    await page.waitForTimeout(3000);
    const uniq = [...new Set(teams)];
    expect(uniq.length).toBeGreaterThanOrEqual(2);
    expect(uniq).not.toContain(FO.limitedTravel);
    expect(uniq.some((id) => !String(id).startsWith("cmoah8mu"))).toBeTruthy();
  });

  test("5) far market: NO_FO_CANDIDATES, not location unresolved", async ({ page }) => {
    let code: string | undefined;
    page.on("response", async (res) => {
      if (
        !res.url().includes("/public-booking/availability") ||
        res.request().method() !== "POST"
      ) {
        return;
      }
      try {
        const j = (await res.json()) as { unavailableReason?: { code?: string } };
        if (j.unavailableReason?.code) code = j.unavailableReason.code;
      } catch {
        /* ignore */
      }
    });

    await page.goto(
      `${PLAYWRIGHT_BASE_URL}${bookingUrl({
        service: "deep-cleaning",
        pubPath: "one_time",
        locStreet: "225 W Douglas Ave",
        locCity: "Wichita",
        locState: "KS",
        locZip: "67202",
        step: "review",
      })}`,
    );
    await waitForReviewReady(page);
    await submitReviewAndWaitForSchedule(page, { expectZeroTeams: true });
    expect(code).toBe("PUBLIC_BOOKING_NO_FO_CANDIDATES");
  });

  test("6) location unresolved path (geocode gate)", async ({ page }) => {
    await page.goto(
      `${PLAYWRIGHT_BASE_URL}${bookingUrl({
        service: "deep-cleaning",
        pubPath: "one_time",
        locStreet: "___NONEXISTENT_SERVICE_LOCATION___",
        locCity: "Tulsa",
        locState: "OK",
        locZip: "74103",
        step: "review",
      })}`,
    );
    await expect(
      page.getByRole("heading", { name: /Review your direction/i }),
    ).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      page.getByText(/couldn.*t verify.*address.*map/i),
    ).toBeVisible();
    await page.locator("#booking-customer-name").fill("Geo fail probe");
    await page.locator("#booking-customer-email").fill(FIXTURE_CUSTOMER_EMAIL);
    /** No live preview → post-estimate visit chips hidden; send stays gated off review. */
    await expect(page.getByTestId("booking-direction-send")).toBeDisabled();
  });
});
