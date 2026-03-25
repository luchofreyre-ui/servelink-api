import { test, expect } from "../fixtures/admin.fixture";
import { openAdminPage } from "../helpers/admin-page";
import { expectCommonAdminShell } from "../assertions/admin";

test.describe("admin smoke", () => {
  test("loads admin dashboard", async ({ page, adminToken }) => {
    await openAdminPage(page, adminToken, "/");
    await expectCommonAdminShell(page);

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText(/operations control center/i);
  });
});
