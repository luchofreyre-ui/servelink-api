import { expect, type Page } from "@playwright/test";

export async function expectNoFatalUiError(page: Page): Promise<void> {
  await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  await expect(page.getByText(/unexpected error/i)).toHaveCount(0);
  await expect(page.getByText(/internal server error/i)).toHaveCount(0);
}

export async function expectPageBodyVisible(page: Page): Promise<void> {
  await expect(page.locator("body")).toBeVisible();
}
