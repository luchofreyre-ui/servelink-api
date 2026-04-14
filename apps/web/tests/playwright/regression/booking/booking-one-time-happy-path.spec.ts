import { expect, test } from "@playwright/test";

const PREVIEW_BODY = JSON.stringify({
  kind: "booking_direction_estimate_preview",
  estimate: {
    priceCents: 66084,
    durationMinutes: 197,
    confidence: 0.65,
  },
  deepCleanProgram: {
    programType: "single_visit_deep_clean",
    visitCount: 1,
    visits: [
      {
        visitIndex: 1,
        label: "Single visit — full deep clean",
        estimatedPriceCents: 66084,
        estimatedDurationMinutes: 197,
        summary: "Playwright preview mock.",
        bundleLabels: ["Deep clean — single session (full)"],
        taskLabels: ["Surface reset & access pass (foundation)"],
      },
    ],
  },
});

const EF = {
  propertyType: "house",
  floors: "1",
  firstTimeWithServelink: "yes",
  lastProfessionalClean: "under_2_weeks",
  clutterLevel: "minimal",
  kitchenCondition: "normal",
  stovetopType: "flat_glass",
  bathroomCondition: "normal",
  glassShowers: "none",
  petPresence: "none",
  petShedding: "",
  petAccidentsOrLitterAreas: "no",
  occupancyState: "occupied_normal",
  floorVisibility: "mostly_clear",
  carpetPercent: "26_50",
  stairsFlights: "none",
  addonIds: [] as string[],
};

function reviewUrl() {
  const qs = new URLSearchParams({
    step: "review",
    service: "deep-cleaning",
    homeSize: "2200 sq ft",
    bedrooms: "2",
    bathrooms: "2",
    pets: "none",
    frequency: "One-Time",
    preferredTime: "Weekday Morning",
    dcProgram: "single_visit",
    ef: JSON.stringify(EF),
  });
  return `/book?${qs.toString()}`;
}

test.describe.configure({ timeout: 120_000 });

test("booking: one-time path reaches confirm with schedule and cleaner summary", async ({
  page,
}) => {
  let previewRequestBody: Record<string, unknown> | null = null;
  let submitRequestBody: Record<string, unknown> | null = null;

  await page.route("**/booking-direction-intake/preview-estimate", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const raw = route.request().postData();
    previewRequestBody = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: PREVIEW_BODY,
    });
  });

  await page.route("**/booking-direction-intake/submit", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const raw = route.request().postData();
    submitRequestBody = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        kind: "booking_direction_intake_submit",
        intakeId: "pw-intake-handoff",
        bookingCreated: true,
        bookingId: "pw-booking-handoff",
        estimate: {
          priceCents: 66084,
          durationMinutes: 197,
          confidence: 0.65,
        },
        deepCleanProgram: null,
        bookingError: null,
      }),
    });
  });

  await page.goto(reviewUrl(), { waitUntil: "domcontentloaded" });

  await page.getByText("Loading…").first().waitFor({ state: "detached", timeout: 60_000 }).catch(() => {});
  await page.locator("#booking-customer-name").waitFor({ state: "visible", timeout: 60_000 });
  await page.locator("#booking-customer-name").fill("One-Time Happy User");
  await page.locator("#booking-customer-email").fill("one-time-happy-booking@example.com");

  await page.getByRole("button", { name: "Continue" }).click();

  await expect(
    page.getByRole("heading", { name: "Choose how you want to proceed" }),
  ).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "One-time cleaning" }).click();

  await expect(page.getByRole("heading", { name: "Confirm and send" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Schedule", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Frequency:/)).toBeVisible();
  await expect(page.getByText("Cleaner preference", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Estimate", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Locked review estimate:/)).toBeVisible();

  expect(previewRequestBody).toBeTruthy();
  expect(previewRequestBody).not.toHaveProperty("estimateFactors");

  await page.getByRole("button", { name: "Confirm Booking Direction" }).click();
  await expect(page).toHaveURL(/\/book\/confirmation/, { timeout: 20_000 });

  expect(submitRequestBody).toBeTruthy();
  expect(submitRequestBody).not.toHaveProperty("estimateFactors");
  const handoff = submitRequestBody?.bookingHandoff as Record<string, unknown> | undefined;
  expect(handoff).toBeTruthy();
  const scheduling = handoff?.scheduling as Record<string, unknown>;
  expect(scheduling?.mode).toBe("preference_only");
  expect(scheduling?.preferredTime).toBeTruthy();
  const cleaner = handoff?.cleanerPreference as Record<string, unknown>;
  expect(cleaner?.mode).toBe("none");
  const recurring = handoff?.recurring as Record<string, unknown>;
  expect(recurring?.pathKind).toBe("one_time");
  expect(recurring?.authRequiredAtConfirm).toBe(false);
});
