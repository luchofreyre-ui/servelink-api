import { expect, test } from "@playwright/test";

/**
 * Deterministic race: preview-estimate is fulfilled only after a long delay so
 * `previewLoading` stays true while we click Continue from review.
 */
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
        summary: "Playwright delayed preview mock.",
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

test("review next is blocked while preview is loading, then allowed after success", async ({
  page,
}) => {
  const previewDelayMs = 10_000;

  await page.route("**/booking-direction-intake/preview-estimate", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await new Promise((r) => setTimeout(r, previewDelayMs));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: PREVIEW_BODY,
    });
  });

  const previewPostPromise = page.waitForRequest(
    (r) =>
      r.url().includes("booking-direction-intake/preview-estimate") &&
      r.method() === "POST",
    { timeout: 30_000 },
  );

  await page.goto(reviewUrl(), { waitUntil: "domcontentloaded" });
  await previewPostPromise;

  const purple = page.locator("div.border-purple-300.bg-purple-50").first();
  await expect(purple).toContainText("Review Guard Truth", { timeout: 30_000 });
  await expect(purple).toContainText("estimateSnapshotPresent: false", {
    timeout: 10_000,
  });
  await expect(purple).toContainText("previewLoading: true", { timeout: 10_000 });

  const blockedLogPromise = page.waitForEvent("console", {
    predicate: (msg) =>
      msg.text().includes("BOOKING_DEBUG_REVIEW_NEXT_ATTEMPT:") &&
      msg.text().includes("blocked_loading"),
    timeout: 25_000,
  });

  await page
    .getByRole("button", { name: "Continue" })
    .click({ force: true });

  await blockedLogPromise;

  const debugStrip = page.locator("div.border-red-300.bg-red-50").first();
  await expect(debugStrip).toContainText("Booking Debug: review");

  await expect(
    page
      .getByRole("paragraph")
      .filter({
        hasText: /^Your estimate is still loading\. Please wait before continuing\.$/,
      })
      .first(),
  ).toBeVisible();

  const attemptsPre = page.getByTestId("booking-debug-review-next-attempts");
  await expect(attemptsPre).toContainText("blocked_loading", { timeout: 15_000 });

  await expect(purple).toContainText("estimateSnapshotPresent: true", {
    timeout: previewDelayMs + 30_000,
  });
  await expect(purple).toContainText("previewLoading: false", {
    timeout: 15_000,
  });

  await page.getByLabel("Full name").fill("Race Test User");
  await page.getByLabel("Email").fill("race-test-booking@example.com");

  await page.getByRole("button", { name: "Continue" }).click();

  await expect(debugStrip).toContainText("Booking Debug: decision", {
    timeout: 20_000,
  });

  await expect(page.getByTestId("booking-debug-review-next-attempts")).toContainText(
    "allowed",
    { timeout: 5_000 },
  );
});
