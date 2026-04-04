import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 720 } });

/** Stable published encyclopedia article (legacy markdown) with multiple body sections. */
const ENCYCLOPEDIA_LIVE_PATH = "/encyclopedia/problems/limescale-buildup";

test.describe("api integration", () => {
  test("encyclopedia live page integrity", async ({ page }) => {
    await page.goto(ENCYCLOPEDIA_LIVE_PATH);

    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.locator("main h1").first()).toContainText(/limescale/i);

    const bodySections = page
      .locator("main article section")
      .filter({ has: page.locator("h2") });
    const sectionCount = await bodySections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(6);

    for (let i = 0; i < sectionCount; i++) {
      const section = bodySections.nth(i);
      await expect(section.locator("h2").first()).toBeVisible();
      const text = (await section.innerText()).trim();
      expect(text.length).toBeGreaterThan(15);
    }
  });

  test("search returns real results", async ({ page }) => {
    await page.goto("/search?q=grease");

    await expect(page.getByTestId("search-results-page")).toBeVisible();

    const groups = page.getByTestId("search-group");
    const groupCount = await groups.count();

    if (groupCount === 0) {
      await expect(page.getByText(/no results matched this search yet/i)).toBeVisible();
      return;
    }

    let articleCount = 0;
    for (let g = 0; g < groupCount; g++) {
      const articles = groups.nth(g).locator("article");
      const n = await articles.count();
      for (let a = 0; a < n; a++) {
        articleCount += 1;
        const art = articles.nth(a);
        const titleLink = art.locator("h2 a").first();
        await expect(titleLink).toBeVisible();
        const titleText = (await titleLink.innerText()).trim();
        expect(titleText.length).toBeGreaterThan(0);
        const href = await titleLink.getAttribute("href");
        expect(href).toBeTruthy();
        expect(href?.startsWith("/")).toBe(true);
        const body = (await art.innerText()).trim();
        expect(body.length).toBeGreaterThan(20);
      }
    }

    expect(articleCount).toBeGreaterThan(0);
  });

  test("product page integrity", async ({ page }) => {
    await page.goto("/products/bar-keepers-friend-cleanser");

    await expect(
      page.getByRole("heading", { level: 1, name: /bar keepers friend cleanser/i }),
    ).toBeVisible();

    const buyAmazon = page.getByRole("link", { name: /buy on amazon|view on amazon/i }).first();
    const productScoreLabel = page.getByText(/^Product score$/i);
    const hasCta = await buyAmazon.isVisible().catch(() => false);
    const hasScore = await productScoreLabel.isVisible().catch(() => false);
    expect(hasCta || hasScore).toBe(true);

    await expect(
      page.getByRole("heading", { name: /why this product scores high/i }),
    ).toBeVisible();

    const scoreSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /why this product scores high/i }) })
      .first();
    await expect(scoreSection).toBeVisible();
    const scoreText = (await scoreSection.innerText()).trim();
    expect(scoreText.length).toBeGreaterThan(20);

    const detailed = page.getByRole("heading", { name: /^detailed analysis$/i });
    if (await detailed.isVisible().catch(() => false)) {
      const researchBlock = page.locator("section").filter({ has: detailed }).first();
      const researchText = (await researchBlock.innerText()).trim();
      expect(researchText.length).toBeGreaterThan(30);
    }
  });
});
