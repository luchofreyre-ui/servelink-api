import { test, expect } from "../../fixtures/admin.fixture";
import { openAdminPage } from "../../helpers/admin-page";
import { expectCommonAdminShell } from "../../assertions/admin";

test.describe("admin dispatch config", () => {
  test("loads dispatch config page", async ({ page, adminToken }) => {
    await openAdminPage(page, adminToken, "/dispatch-config");
    await expectCommonAdminShell(page);

    await expect(page.locator("body")).toContainText(/dispatch config|weight|offer expiry|grace/i);
  });

  test("shows active or draft config content", async ({ page, adminToken, scenario }) => {
    await openAdminPage(page, adminToken, "/dispatch-config");
    await expectCommonAdminShell(page);

    if (scenario.dispatchConfig.activeId || scenario.dispatchConfig.draftId) {
      await expect(page.locator("body")).toContainText(/active|draft|publish|version/i);
    } else {
      await expect(page.locator("body")).toContainText(/dispatch config/i);
    }
  });
});
