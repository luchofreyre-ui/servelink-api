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
