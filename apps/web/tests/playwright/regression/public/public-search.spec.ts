import { expect, test } from "@playwright/test";
import { searchTestIds } from "../../selectors/search";

test.use({ viewport: { width: 1280, height: 720 } });

test.describe("public search", () => {
  test("typing soap scum into global search shows suggestions", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("header").getByTestId(searchTestIds.globalSearchInput).first();
    await input.fill("soap scum");
    await expect(page.getByTestId(searchTestIds.globalSearchSuggestions).first()).toBeVisible();
    await expect(page.getByTestId(searchTestIds.globalSearchSuggestionItem).first()).toBeVisible();
  });

  test("clicking a suggestion navigates to a matching knowledge page", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("header").getByTestId(searchTestIds.globalSearchInput).first();
    await input.fill("soap scum");
    await expect(page.getByTestId(searchTestIds.globalSearchSuggestionItem).first()).toBeVisible();

    await page.getByTestId(searchTestIds.globalSearchSuggestionItem).first().click();

    await expect(page).not.toHaveURL(/\/search\?/);
    await expect(page).toHaveURL(
      /\/(problems|surfaces|methods|guides|clusters|questions|tools|encyclopedia)(\/|$)/,
    );
  });

  test("submitting search goes to /search?q=soap%20scum", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("header").getByTestId(searchTestIds.globalSearchForm).first();
    await form.getByTestId(searchTestIds.globalSearchInput).fill("soap scum");
    await form.getByTestId(searchTestIds.globalSearchSubmit).click();

    await expect(page).toHaveURL(/\/search\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("q")).toBe("soap scum");
  });

  test("results page shows best match", async ({ page }) => {
    await page.goto("/search?q=soap%20scum");
    await expect(page.getByTestId(searchTestIds.searchResultsPage)).toBeVisible();
    await expect(page.getByTestId(searchTestIds.searchBestMatch)).toBeVisible();
    await expect(page.getByTestId(searchTestIds.searchBestMatch)).toContainText(/soap/i);
  });

  test("grouped sections render", async ({ page }) => {
    await page.goto("/search?q=soap%20scum");
    await expect(page.getByTestId(searchTestIds.searchResultsPage)).toBeVisible();
    const groups = page.getByTestId(searchTestIds.searchGroup);
    await expect(groups.first()).toBeVisible();
    expect(await groups.count()).toBeGreaterThan(0);
  });
});
