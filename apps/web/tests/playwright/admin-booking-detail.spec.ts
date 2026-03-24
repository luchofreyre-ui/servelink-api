import { test, expect } from "./helpers/admin-fixture";
import { openAdminPage, expectCommonAdminShell } from "./helpers/admin-page";

test.describe("admin booking detail", () => {
  test("opens pending dispatch booking detail", async ({ page, adminToken, scenario }) => {
    await openAdminPage(page, adminToken, `/bookings/${scenario.bookingIds.pendingDispatch}`);
    await expectCommonAdminShell(page);

    await expect(page.locator("body")).toContainText(/booking|status|customer|service/i);
    await expect(
      page.getByRole("region", { name: /command center authority/i }),
    ).toBeVisible();
  });

  test("opens hold booking detail", async ({ page, adminToken, scenario }) => {
    await openAdminPage(page, adminToken, `/bookings/${scenario.bookingIds.hold}`);
    await expectCommonAdminShell(page);

    await expect(page.locator("body")).toContainText(/hold|status/i);
  });

  test("opens review booking detail", async ({ page, adminToken, scenario }) => {
    await openAdminPage(page, adminToken, `/bookings/${scenario.bookingIds.review}`);
    await expectCommonAdminShell(page);

    await expect(page.locator("body")).toContainText(/review|status/i);
  });
});
