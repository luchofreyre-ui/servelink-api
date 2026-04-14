import { expect, test } from "../../fixtures/admin.fixture";
import { openAdminPage } from "../../helpers/admin-page";
import { expectCommonAdminShell } from "../../assertions/admin";

test.describe("admin recurring ops page", () => {
  test("recurring operations route renders shell and funnel intake note", async ({
    page,
    adminToken,
  }) => {
    await openAdminPage(page, adminToken, "/admin/ops/recurring");
    await expectCommonAdminShell(page);

    await expect(
      page.getByRole("heading", { name: "Recurring Operations" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Public booking funnel vs intake API" }),
    ).toBeVisible();
  });
});
