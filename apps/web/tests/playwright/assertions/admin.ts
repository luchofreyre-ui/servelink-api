import { expect, type Page } from "@playwright/test";
import { expectNoFatalUiError, expectPageBodyVisible } from "./common";

export async function expectCommonAdminShell(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/admin/);
  await expectPageBodyVisible(page);
  await expectNoFatalUiError(page);
}
