import type { Page } from "@playwright/test";
import { gotoAuthedPage } from "./auth";

export async function openAuthedRolePage(
  page: Page,
  token: string,
  path: string,
): Promise<void> {
  await gotoAuthedPage(page, path, token);
}
