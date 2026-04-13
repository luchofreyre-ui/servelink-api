import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 720 } });

test.describe("core flows", () => {
  test("homepage → problems flow", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /the cleaning solution system/i }),
    ).toBeVisible();

    await page.locator("header").getByRole("link", { name: "Problems" }).click();

    await expect(page).toHaveURL(/\/problems\/?$/);

    await expect(
      page.getByRole("heading", { level: 1, name: /cleaning problems/i }),
    ).toBeVisible();

    const problemLinks = page.locator('main a[href^="/problems/"]');
    await expect(problemLinks.first()).toBeVisible();
  });

  test("problems → grease-buildup", async ({ page }) => {
    await page.goto("/problems");

    await page.getByRole("link", { name: "Grease buildup", exact: true }).click();

    await expect(page).toHaveURL(/\/problems\/grease-buildup/);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await expect(page.getByTestId("problem-quick-fix")).toBeVisible();
  });

  test("problems → hard-water-deposits", async ({ page }) => {
    await page.goto("/problems");

    await page.getByRole("link", { name: "Hard water deposits", exact: true }).click();

    await expect(page).toHaveURL(/\/problems\/hard-water-deposits/);

    await expect(page.getByTestId("problem-quick-fix")).toBeVisible();
  });

  test("product page loads", async ({ page }) => {
    await page.goto("/products/bar-keepers-friend-cleanser");

    await expect(
      page.getByRole("heading", { level: 1, name: /bar keepers friend cleanser/i }),
    ).toBeVisible();

    const productShell = page.getByRole("main");
    await expect(productShell).toBeVisible();
    const text = await productShell.innerText();
    expect(text.trim().length).toBeGreaterThan(80);
  });

  test("search basic", async ({ page }) => {
    await page.goto("/search?q=grease");

    await expect(page.getByTestId("search-results-page")).toBeVisible();

    const candidates = [
      page.getByTestId("search-group").first(),
      page.getByText(/no results matched this search yet/i),
    ];

    let anyVisible = false;
    for (const candidate of candidates) {
      if (await candidate.isVisible().catch(() => false)) {
        anyVisible = true;
        break;
      }
    }

    expect(anyVisible).toBe(true);
  });
});
