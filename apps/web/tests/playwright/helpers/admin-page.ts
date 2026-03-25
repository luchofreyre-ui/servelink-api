import { Page } from "@playwright/test";
import { gotoAuthedAdminPage } from "./auth";

export async function openAdminPage(page: Page, adminToken: string, path: string): Promise<void> {
  await gotoAuthedAdminPage(page, path, adminToken);
}
