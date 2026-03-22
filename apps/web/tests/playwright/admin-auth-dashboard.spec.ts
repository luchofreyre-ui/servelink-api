import { test, expect } from "@playwright/test";
import { test as scenarioTest } from "./helpers/admin-fixture";
import { openAdminPage, expectCommonAdminShell } from "./helpers/admin-page";

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

    await expect(
      page.getByRole("heading", { name: "Authentication required" }),
    ).toBeVisible();

    await expect(
      page.getByText("No auth token was found in localStorage."),
    ).toBeVisible();
  });

  scenarioTest("loads live admin dashboard with real token", async ({ page, adminToken }) => {
    await openAdminPage(page, adminToken, "/");
    await expectCommonAdminShell(page);

    await expect(
      page.getByRole("heading", { name: "Real operations data" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Dispatch exceptions" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Admin activity" }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Replace token" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Clear token" }),
    ).toBeVisible();
  });
});
