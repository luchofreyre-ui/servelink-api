import { test, expect, Page } from "@playwright/test";

async function selectFirstAvailableTeam(page: Page) {
  const section = page.getByTestId("booking-schedule-team-section");

  await expect(section).toBeVisible({ timeout: 60000 });

  const teamOptions = section.locator("[data-testid^='team-option']");

  await expect(teamOptions.first()).toBeVisible({ timeout: 60000 });

  await teamOptions.first().click();

  await expect(page.getByTestId("booking-schedule-slot-section")).toBeVisible({
    timeout: 60000,
  });
}

test.describe("public booking — controlled FO fixture matrix (browser)", () => {
  test("core flow: team → slot → confirm", async ({ page }) => {
    await page.goto("/book");

    await page.getByTestId("booking-review-submit").click();

    await selectFirstAvailableTeam(page);

    await expect(
      page.getByTestId("booking-schedule-slot-section")
    ).toBeVisible();
  });
});
