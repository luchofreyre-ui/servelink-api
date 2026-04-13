import type { Page } from "@playwright/test";
import { test as baseTest, expect } from "../../fixtures/admin.fixture";
import { openAdminPage } from "../../helpers/admin-page";
import { PLAYWRIGHT_API_BASE_URL } from "../../helpers/env";
import { fetchFreshPlaywrightScenario } from "../../helpers/scenario";

function waitForOpsPageRefresh(page: Page) {
  return page.waitForResponse(
    (r) => {
      if (r.request().method() !== "GET") return false;
      const u = r.url();
      return (
        u.includes("/api/v1/system/ops") ||
        (u.includes("/admin/ops") && !u.includes("favicon"))
      );
    },
    { timeout: 45_000 },
  );
}

/** Re-seed Nest Playwright scenario so `bookingIds.review` stays clearable. */
const testSeeded = baseTest.extend({
  scenario: async ({}, use) => {
    const payload = await fetchFreshPlaywrightScenario();
    await use(payload.scenario);
  },
});

type DrilldownKind = "locked" | "review" | "deferred";

type EligibleOpsAction = {
  kind: DrilldownKind;
  bookingId: string;
  buttonName: string;
};

function pickEligibleActionFromRow(
  row: Record<string, unknown>,
): { buttonName: string } | null {
  if (row.canReleaseDispatchLock === true) {
    return { buttonName: "Release lock" };
  }
  if (row.canClearReviewRequired === true) {
    return { buttonName: "Clear review" };
  }
  if (row.canAssignExceptionToMe === true) {
    return { buttonName: "Assign to me" };
  }
  if (row.canResolveException === true) {
    return { buttonName: "Mark resolved" };
  }
  if (row.canTriggerRedispatch === true) {
    return { buttonName: "Redispatch" };
  }
  return null;
}

function bookingIdForRow(
  row: Record<string, unknown>,
  kind: DrilldownKind,
): string | null {
  if (kind === "locked") {
    return row.id != null ? String(row.id) : null;
  }
  if (kind === "review") {
    const booking = row.booking as Record<string, unknown> | undefined;
    const id = row.bookingId ?? booking?.id;
    return id != null ? String(id) : null;
  }
  return row.bookingId != null ? String(row.bookingId) : null;
}

async function findEligibleOpsActionFromDrilldowns(
  token: string,
): Promise<EligibleOpsAction | null> {
  const probes: Array<{
    kind: DrilldownKind;
    path: string;
  }> = [
    {
      kind: "locked",
      path: "/system/ops/bookings/dispatch-locked?limit=25",
    },
    {
      kind: "review",
      path: "/system/ops/bookings/review-required?limit=25",
    },
    {
      kind: "deferred",
      path: "/system/ops/dispatch/deferred?limit=25",
    },
  ];

  for (const probe of probes) {
    const res = await fetch(`${PLAYWRIGHT_API_BASE_URL}${probe.path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      continue;
    }
    const body = (await res.json()) as { ok?: boolean; items?: unknown[] };
    const items = Array.isArray(body.items) ? body.items : [];
    for (const raw of items) {
      if (!raw || typeof raw !== "object") {
        continue;
      }
      const row = raw as Record<string, unknown>;
      const picked = pickEligibleActionFromRow(row);
      const bookingId = bookingIdForRow(row, probe.kind);
      if (picked && bookingId) {
        return {
          kind: probe.kind,
          bookingId,
          buttonName: picked.buttonName,
        };
      }
    }
  }

  return null;
}

baseTest.describe("admin ops inline actions", () => {
  testSeeded(
    "deterministic: seeded Clear review from #review-required (page is verifier)",
    async ({ page, adminToken, scenario }) => {
      const seededReviewId = scenario.bookingIds?.review?.trim();
      expect(
        seededReviewId,
        "Playwright admin scenario must expose bookingIds.review",
      ).toBeTruthy();

      await openAdminPage(page, adminToken, "/admin/ops");
      await expect(
        page.getByRole("heading", { level: 1, name: /operations control center/i }),
      ).toBeVisible({ timeout: 30_000 });

      const reviewSection = page.locator("#review-required");

      await expect(
        reviewSection.getByRole("link", {
          name: seededReviewId!,
          exact: true,
        }),
      ).toBeVisible({ timeout: 15_000 });

      const bookingLink = reviewSection.getByRole("link", {
        name: seededReviewId!,
        exact: true,
      });

      const bookingHref =
        (await bookingLink.getAttribute("href")) ?? "";

      const reviewRow = reviewSection
        .locator("tbody tr")
        .filter({
          has: page.locator(`a[href="${bookingHref}"]`),
        })
        .first();

      await expect(reviewRow).toBeVisible({ timeout: 15_000 });

      const clearReviewButton = reviewRow.getByRole("button", {
        name: "Clear review",
        exact: true,
      });

      await expect(clearReviewButton).toBeVisible({ timeout: 15_000 });
      await expect(clearReviewButton).toBeEnabled({ timeout: 15_000 });

      const postPath = `/api/v1/system/ops/bookings/${encodeURIComponent(seededReviewId!)}/clear-review-required`;
      const postPromise = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" && r.url().includes(postPath),
      );
      const refreshPromise = waitForOpsPageRefresh(page);

      await clearReviewButton.click();

      const postResp = await postPromise;
      expect(postResp.status()).toBeLessThan(500);

      const postJson = (await postResp.json()) as { ok?: boolean };
      expect(postJson.ok).toBe(true);

      await Promise.race([
        expect(reviewRow).toContainText("Done.", { timeout: 15_000 }),
        expect(reviewRow).toBeHidden({ timeout: 15_000 }),
        expect(
          reviewSection.getByRole("link", {
            name: seededReviewId!,
            exact: true,
          }),
        ).toHaveCount(0, { timeout: 15_000 }),
      ]);

      await refreshPromise;
    },
    { timeout: 90_000 },
  );

  baseTest(
    "adaptive: any eligible drilldown row when present (may skip)",
    async ({ page, adminToken }) => {
      const eligible = await findEligibleOpsActionFromDrilldowns(adminToken);
      if (!eligible) {
        test.skip(
          true,
          "No drilldown rows with a server-eligible ops action in this environment",
        );
        return;
      }

      const sectionId =
        eligible.kind === "locked"
          ? "dispatch-locked"
          : eligible.kind === "review"
            ? "review-required"
            : "deferred-dispatch";

      await openAdminPage(page, adminToken, "/admin/ops");
      await expect(
        page.getByRole("heading", { level: 1, name: /operations control center/i }),
      ).toBeVisible({ timeout: 30_000 });

      const section = page.locator(`#${sectionId}`);
      await section.scrollIntoViewIfNeeded();

      const row = section
        .locator("tbody tr")
        .filter({ hasText: eligible.bookingId })
        .first();

      const button = row.getByRole("button", {
        name: eligible.buttonName,
        exact: true,
      });

      await expect(button).toBeEnabled({ timeout: 15_000 });

      const postPromise = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          r.url().includes("/api/v1/system/ops/"),
      );
      const refreshPromise = waitForOpsPageRefresh(page);

      await button.click();

      const postResp = await postPromise;
      expect(postResp.status()).toBeGreaterThanOrEqual(200);
      expect(postResp.status()).toBeLessThan(500);

      const postJson = (await postResp.json()) as { ok?: boolean };
      expect(postJson.ok).toBe(true);

      try {
        await expect(row.getByText("Done.", { exact: true })).toBeVisible({
          timeout: 8_000,
        });
      } catch {
        await expect(
          section.locator("tbody tr").filter({ hasText: eligible.bookingId }),
        ).toHaveCount(0, { timeout: 20_000 });
      }

      await refreshPromise;
    },
  );
});
