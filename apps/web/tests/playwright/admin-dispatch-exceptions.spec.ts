import { test, expect } from "./helpers/admin-fixture";
import { openAdminPage, expectCommonAdminShell } from "./helpers/admin-page";

test.describe("admin dispatch exceptions", () => {
  test("loads exceptions index", async ({ page, adminToken }) => {
    await openAdminPage(page, adminToken, "/exceptions");
    await expectCommonAdminShell(page);

    await expect(page.locator("body")).toContainText(/exception|dispatch/i);
  });

  test("opens exception detail when scenario provides one", async ({ page, adminToken, scenario }) => {
    test.skip(!scenario.exceptionId, "Scenario did not provide an exception id");

    await openAdminPage(page, adminToken, `/exceptions/${scenario.exceptionId}`);
    await expectCommonAdminShell(page);

    await expect(page.locator("body")).toContainText(/exception|booking|reason|status/i);
  });
});
