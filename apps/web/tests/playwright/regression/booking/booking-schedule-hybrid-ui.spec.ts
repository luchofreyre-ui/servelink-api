import { expect, test } from "@playwright/test";

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

function scheduleUrl() {
  const qs = new URLSearchParams({
    step: "schedule",
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

test.describe.configure({ timeout: 60_000 });

test("booking: schedule step shows hybrid arrival-window section + preference fallback", async ({
  page,
}) => {
  await page.goto(scheduleUrl(), { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Choose your schedule" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Arrival windows (when available)")).toBeVisible();
  await expect(
    page.getByText(/Sign in as a customer to load live arrival windows/),
  ).toBeVisible();
  await expect(page.getByText("Visit timing preferences")).toBeVisible();
});

test("booking: signed-in customer sees aggregate slot cards + candidate trust copy", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("token", "playwright-customer-token");
    window.localStorage.setItem(
      "servelink_user",
      JSON.stringify({
        id: "playwright-customer",
        email: "playwright+customer@servelink.test",
        role: "customer",
      }),
    );
  });

  await page.route("**/bookings/availability/windows/aggregate**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        mode: "multi_provider_candidates",
        windows: [
          {
            foId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
            cleanerId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
            cleanerLabel: "Aggregate test team",
            startAt: "2030-05-10T14:00:00.000Z",
            endAt: "2030-05-10T17:00:00.000Z",
            windowLabel: "2030-05-10T14:00:00.000Z → 2030-05-10T17:00:00.000Z",
            source: "candidate_provider",
          },
        ],
      }),
    });
  });

  await page.goto(scheduleUrl(), { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Choose your schedule" }),
  ).toBeVisible({ timeout: 30_000 });
  const slotBtn = page.locator("button", { hasText: "Backed by an available team" }).first();
  await expect(slotBtn).toBeVisible({ timeout: 30_000 });
  await slotBtn.click();
  await expect(slotBtn).toHaveClass(/ecfdf5/);
});
