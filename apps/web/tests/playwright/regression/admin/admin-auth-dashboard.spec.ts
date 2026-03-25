import { test, expect } from "@playwright/test";
import { test as scenarioTest } from "../../fixtures/admin.fixture";
import { openAdminPage } from "../../helpers/admin-page";
import { expectCommonAdminShell } from "../../assertions/admin";

test.describe("admin auth + dashboard", () => {
  test("renders admin auth page", async ({ page }) => {
    await page.goto("/admin/auth", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: "Authenticate the real admin console." }),
    ).toBeVisible();

    await expect(page.getByText("POST /api/v1/auth/login")).toBeVisible();
    await expect(page.getByLabel("Admin email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("gates /admin when token is missing", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/authentication required/i)).toBeVisible();
  });

  scenarioTest("loads live admin dashboard with real token", async ({ page, adminToken }) => {
    await openAdminPage(page, adminToken, "/");
    await expectCommonAdminShell(page);

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText(/operations control center/i);

    await expect(
      page.getByRole("heading", { name: /recent dispatch exceptions/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /recent admin activity/i }),
    ).toBeVisible();
  });
});
