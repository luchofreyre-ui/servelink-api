import { test, expect } from "../../fixtures/admin.fixture";
import { openAdminPage } from "../../helpers/admin-page";
import { expectCommonAdminShell } from "../../assertions/admin";

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
