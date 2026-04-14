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

function confirmUrlWithoutRunningPreview() {
  const qs = new URLSearchParams({
    step: "confirm",
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

test("booking: confirm step without estimate snapshot stays blocked", async ({ page }) => {
  await page.goto(confirmUrlWithoutRunningPreview(), { waitUntil: "domcontentloaded" });

  await expect(
    page.getByText(
      "Your estimate snapshot is missing. Go back to review and wait for the estimate to load.",
    ).first(),
  ).toBeVisible({ timeout: 30_000 });

  await expect(page.getByRole("button", { name: "Confirm Booking Direction" })).toBeDisabled();
});
