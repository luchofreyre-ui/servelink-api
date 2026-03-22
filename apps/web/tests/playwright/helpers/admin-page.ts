import { Page, expect } from "@playwright/test";
import { gotoAuthedAdminPage } from "./auth";

export async function openAdminPage(page: Page, adminToken: string, path: string): Promise<void> {
  await gotoAuthedAdminPage(page, path, adminToken);
}

export async function expectNoFatalUiError(page: Page): Promise<void> {
  await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  await expect(page.getByText(/unexpected error/i)).toHaveCount(0);
}

export async function expectCommonAdminShell(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.locator("body")).toBeVisible();
  await expectNoFatalUiError(page);
}
