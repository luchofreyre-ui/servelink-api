import { expect, test } from "@playwright/test";
import { knowledgeTestIds } from "../../selectors/knowledge";
import { searchTestIds } from "../../selectors/search";

test.use({ viewport: { width: 1280, height: 720 } });

test.describe("public encyclopedia", () => {
  test("encyclopedia landing page hero renders", async ({ page }) => {
    await page.goto("/encyclopedia");
    await expect(
      page.getByRole("heading", { name: /your home\. every material\. every challenge\. explained\./i }),
    ).toBeVisible();
    await expect(page.getByText(/browse by category to find expert knowledge/i)).toBeVisible();
    await expect(page.getByTestId(knowledgeTestIds.encyclopediaHeroSearch)).toBeVisible();
  });

  test("methods / surfaces / problems cards navigate correctly", async ({ page }) => {
    await page.goto("/encyclopedia");

    await page.locator('a[href="/methods"]').first().click();
    await expect(page).toHaveURL(/\/methods$/);
    await page.goBack();

    await page.locator('a[href="/surfaces"]').first().click();
    await expect(page).toHaveURL(/\/surfaces$/);
    await page.goBack();

    await page.locator('a[href="/problems"]').first().click();
    await expect(page).toHaveURL(/\/problems$/);
  });

  test("encyclopedia hero search submits to results page", async ({ page }) => {
    await page.goto("/encyclopedia");

    const hero = page.getByTestId(knowledgeTestIds.encyclopediaHeroSearch);
    const form = hero.getByTestId(searchTestIds.globalSearchForm);
    await form.getByTestId(searchTestIds.globalSearchInput).fill("soap scum");
    await form.getByTestId(searchTestIds.globalSearchSubmit).click();

    await expect(page).toHaveURL(/\/search\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("q")).toBe("soap scum");
  });
});
