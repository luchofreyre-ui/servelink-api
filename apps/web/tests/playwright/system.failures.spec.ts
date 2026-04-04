import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 720 } });

const ROUTES = [
  "/",
  "/problems",
  "/surfaces",
  "/encyclopedia/problems/limescale-buildup",
  "/products/bar-keepers-friend-cleanser",
  "/search?q=grease",
];

test.describe("system failures", () => {
  test("no literal undefined/null in document; main has content; no console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    for (const path of ROUTES) {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");

      const bodyText = await page.locator("body").innerText();
      expect(bodyText).not.toMatch(/\bundefined\b/i);
      expect(bodyText).not.toMatch(/\bnull\b/i);

      const main = page.locator("main").first();
      if ((await main.count()) > 0) {
        const mainText = (await main.innerText()).trim();
        expect(mainText.length).toBeGreaterThan(5);
      }
    }

    expect(consoleErrors, `Console errors: ${consoleErrors.join("\n")}`).toEqual([]);
  });
});
