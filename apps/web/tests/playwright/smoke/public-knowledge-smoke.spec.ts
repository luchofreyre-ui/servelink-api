import { expect, test } from "@playwright/test";
import { knowledgeTestIds } from "../selectors/knowledge";
import { searchTestIds } from "../selectors/search";

test.use({ viewport: { width: 1280, height: 720 } });

test.describe("public knowledge smoke", () => {
  test("/encyclopedia loads", async ({ page }) => {
    await page.goto("/encyclopedia");
    await expect(page.getByTestId(knowledgeTestIds.encyclopediaPage)).toBeVisible();
    await expect(page.getByRole("heading", { name: /cleaning encyclopedia/i })).toBeVisible();
  });

  test("public header shows Encyclopedia nav", async ({ page }) => {
    await page.goto("/encyclopedia");
    const encyLink = page.getByTestId(knowledgeTestIds.publicNavEncyclopedia).first();
    await expect(encyLink).toBeVisible();
    await expect(encyLink).toHaveAttribute("href", "/encyclopedia");
  });

  test("public header shows search input", async ({ page }) => {
    await page.goto("/encyclopedia");
    const input = page.locator("header").getByTestId(searchTestIds.globalSearchInput).first();
    await expect(input).toBeVisible();
  });
});
