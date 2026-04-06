import { test, expect } from "../../fixtures/admin.fixture";
import { openAdminPage } from "../../helpers/admin-page";
import { expectCommonAdminShell } from "../../assertions/admin";

test.describe("admin booking detail", () => {
  test("opens pending dispatch booking detail", async ({ page, adminToken, scenario }) => {
    await openAdminPage(page, adminToken, `/bookings/${scenario.bookingIds.pendingDispatch}`);
    await expectCommonAdminShell(page);

    await expect(page.locator("body")).toContainText(/booking|status|customer|service/i);
    await expect(
      page.getByRole("region", { name: /command center authority/i }),
    ).toBeVisible();

    const paymentRegion = page.getByRole("region", { name: /booking payment/i });
    await expect(paymentRegion).toBeVisible();
    await expect(paymentRegion.getByText(/payment source:/i)).toBeVisible();
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
