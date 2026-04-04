import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 720 } });

async function assertNo404(page: Page) {
  await expect(page.getByRole("heading", { name: /^404$/ })).toHaveCount(0);
}

function normalizePathname(p: string): string {
  const withoutQuery = p.split("?")[0].split("#")[0];
  return withoutQuery.replace(/\/$/, "") || "/";
}

async function clickFirstMainLinks(page: Page, basePath: string): Promise<void> {
  await page.goto(basePath);
  await expect(page.locator("main").first()).toBeVisible();

  const rootText = (await page.locator("main").first().innerText()).trim();
  expect(rootText.length).toBeGreaterThan(10);

  for (let i = 0; i < 3; i++) {
    await page.goto(basePath);
    const link = page.locator('main a[href^="/"]').nth(i);
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    const expectedPath = normalizePathname(href!);

    await Promise.all([
      page.waitForURL(
        (url) => {
          try {
            return normalizePathname(new URL(url).pathname) === expectedPath;
          } catch {
            return false;
          }
        },
        { timeout: 15_000 },
      ),
      link.click(),
    ]);

    await assertNo404(page);

    await expect(page.locator("main").first()).toBeVisible();
    const inner = (await page.locator("main").first().innerText()).trim();
    expect(inner.length).toBeGreaterThan(15);

    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
  }
}

test.describe("navigation integrity", () => {
  test("homepage first three main links", async ({ page }) => {
    await clickFirstMainLinks(page, "/");
  });

  test("problems index first three main links", async ({ page }) => {
    await clickFirstMainLinks(page, "/problems");
  });

  test("surfaces index first three main links", async ({ page }) => {
    await clickFirstMainLinks(page, "/surfaces");
  });
});
