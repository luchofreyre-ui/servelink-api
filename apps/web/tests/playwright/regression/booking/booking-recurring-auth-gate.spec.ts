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

function anchorDatePlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

test.describe.configure({ timeout: 120_000 });

test("booking: recurring guest completes setup then auth gate only at final confirm submit", async ({
  page,
}) => {
  await page.route("**/booking-direction-intake/preview-estimate", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: PREVIEW_BODY,
    });
  });

  await page.goto(reviewUrl(), { waitUntil: "domcontentloaded" });

  await page.getByText("Loading…").first().waitFor({ state: "detached", timeout: 60_000 }).catch(() => {});
  await page.locator("#booking-customer-name").waitFor({ state: "visible", timeout: 60_000 });
  await page.locator("#booking-customer-name").fill("Recurring Auth Gate User");
  await page.locator("#booking-customer-email").fill("recurring-auth-gate-booking@example.com");

  await page.getByRole("button", { name: "Continue" }).click();

  await expect(
    page.getByRole("heading", { name: "Choose how you want to proceed" }),
  ).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Weekly", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Set up your recurring plan" })).toBeVisible({
    timeout: 30_000,
  });
  expect(page.url()).toMatch(/\/book/);
  expect(page.url()).not.toMatch(/customer\/auth|auth\/login/);

  await page.locator("#recurring-next-anchor-date").fill(anchorDatePlusDays(14));
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Confirm and send" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Recurring · Weekly")).toBeVisible();
  await expect(page.getByText(/Frequency:/).first()).toBeVisible();
  await expect(
    page.getByText("Please sign in to continue with your recurring plan."),
  ).toBeVisible();

  const beforeAuthUrl = new URL(page.url());
  expect(beforeAuthUrl.searchParams.get("cadence")).toBe("weekly");
  expect(beforeAuthUrl.searchParams.get("bookingPath")).toBe("recurring");
  expect(beforeAuthUrl.searchParams.get("frequency")).not.toBe("One-Time");
  await expect(page.getByTestId("booking-debug-url-state-consistent")).toHaveText(/true/);

  const authNav = page.waitForURL(/\/customer\/auth/, { timeout: 20_000 });
  await page.getByRole("button", { name: "Confirm Booking Direction" }).click();
  await authNav;
  expect(page.url()).toContain("redirect=");

  const persisted = await page.evaluate(() =>
    window.sessionStorage.getItem("booking_flow_state"),
  );
  expect(persisted).toBeTruthy();
  const saved = JSON.parse(persisted!) as { recurringIntent?: { type?: string } };
  expect(saved.recurringIntent?.type).toBe("recurring");
});
