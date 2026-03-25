import {
  customerDashboardPath,
  expect,
  openCustomerAuthedPath,
  test,
} from "../fixtures/customer.fixture";

test.describe("customer smoke", () => {
  test("customer auth page renders", async ({ page }) => {
    await page.goto("/customer/auth");
    await expect(page.getByRole("heading", { name: /^customer sign in$/i })).toBeVisible();
    await expect(
      page.getByText(/sign in to view your bookings and service updates/i),
    ).toBeVisible();
  });

  test("customer dashboard loads with real token", async ({ page, customerToken }) => {
    await openCustomerAuthedPath(page, customerToken, customerDashboardPath());
    await expect(page.getByRole("heading", { name: /^your bookings$/i })).toBeVisible();
    await expect(page.getByText(/customer-safe view/i)).toBeVisible();
  });
});
