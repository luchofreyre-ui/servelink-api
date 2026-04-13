import { test as base, expect } from "@playwright/test";
import { test as scenarioTest } from "../fixtures/admin.fixture";
import { openAdminPage } from "../helpers/admin-page";

scenarioTest("probe admin payment operations heading", async ({ page, adminToken }) => {
  await openAdminPage(page, adminToken, "/");

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1500);

  console.log("FINAL_URL:", page.url());

  const headings = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((nodes) =>
    nodes.map((node) => ({
      tag: node.tagName.toLowerCase(),
      text: (node.textContent || "").replace(/\s+/g, " ").trim(),
      ariaHidden: node.getAttribute("aria-hidden"),
      hidden:
        (node as HTMLElement).hidden ||
        window.getComputedStyle(node as Element).display === "none" ||
        window.getComputedStyle(node as Element).visibility === "hidden",
    })),
  );

  console.log("HEADINGS_JSON:", JSON.stringify(headings, null, 2));

  const paymentHeadingCount = await page
    .getByRole("heading", { name: "Payment operations", exact: true })
    .count();

  console.log("PAYMENT_HEADING_COUNT:", paymentHeadingCount);

  const recentDispatchCount = await page
    .getByRole("heading", { name: /recent dispatch exceptions/i })
    .count();

  const recentActivityCount = await page
    .getByRole("heading", { name: /recent admin activity/i })
    .count();

  console.log("RECENT_DISPATCH_COUNT:", recentDispatchCount);
  console.log("RECENT_ACTIVITY_COUNT:", recentActivityCount);

  await page.screenshot({
    path: "test-results/admin-payment-probe.png",
    fullPage: true,
  });

  expect(await page.getByRole("heading", { level: 1 }).textContent()).toBeTruthy();
});
