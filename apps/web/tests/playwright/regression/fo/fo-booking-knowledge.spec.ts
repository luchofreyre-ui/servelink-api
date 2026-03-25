import {
  expect,
  foBookingDetailPath,
  openFoAuthedPath,
  test,
} from "../../fixtures/fo.fixture";
import { knowledgeTestIds } from "../../selectors/knowledge";

test.describe("FO booking knowledge", () => {
  test("booking detail renders knowledge action block", async ({
    page,
    foToken,
    foBookingIds,
  }) => {
    const bookingId = foBookingIds.active;
    await openFoAuthedPath(page, foToken, foBookingDetailPath(bookingId));

    await expect(page.getByTestId("fo-booking-knowledge-guidance")).toBeVisible();
    await expect(page.getByTestId(knowledgeTestIds.foBookingKnowledgeActions)).toBeVisible();
    await expect(page.getByTestId(knowledgeTestIds.foBookingOpenQuickSolve)).toBeVisible();
    await expect(page.getByTestId(knowledgeTestIds.foBookingSearchKnowledge)).toBeVisible();
  });

  test("booking detail renders scenario shortcuts when available", async ({
    page,
    foToken,
    foBookingIds,
  }) => {
    const bookingId = foBookingIds.active;
    await openFoAuthedPath(page, foToken, foBookingDetailPath(bookingId));

    const shortcuts = page.getByTestId(knowledgeTestIds.foBookingScenarioShortcuts);
    const shortcutLinks = shortcuts.locator("a[href*='/fo/knowledge']");

    const count = await shortcutLinks.count();
    if (count === 0) {
      test.info().annotations.push({
        type: "note",
        description:
          "No scenario shortcuts for this booking (haystack did not match soap/grease/mildew signals).",
      });
      return;
    }

    await expect(shortcuts).toBeVisible();
    await expect(shortcutLinks.first()).toBeVisible();
  });

  test('clicking "Open Quick Solve" goes to /fo/knowledge with focusQuickSolve=1', async ({
    page,
    foToken,
    foBookingIds,
  }) => {
    const bookingId = foBookingIds.active;
    await openFoAuthedPath(page, foToken, foBookingDetailPath(bookingId));

    await page.getByTestId(knowledgeTestIds.foBookingOpenQuickSolve).click();

    await expect(page).toHaveURL(/\/fo\/knowledge\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/fo/knowledge");
    expect(url.searchParams.get("focusQuickSolve")).toBe("1");
    expect(url.searchParams.get("bookingId")).toBe(bookingId);
  });

  test('clicking "Search Knowledge" goes to /fo/knowledge with query context', async ({
    page,
    foToken,
    foBookingIds,
  }) => {
    const bookingId = foBookingIds.active;
    await openFoAuthedPath(page, foToken, foBookingDetailPath(bookingId));

    const searchLink = page.getByTestId(knowledgeTestIds.foBookingSearchKnowledge);
    const href = await searchLink.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href!.startsWith("/fo/knowledge")).toBe(true);

    await searchLink.click();

    await expect(page).toHaveURL(/\/fo\/knowledge\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/fo/knowledge");
    expect(url.searchParams.get("bookingId")).toBe(bookingId);
    if (href!.includes("q=")) {
      expect(url.searchParams.get("q")).toBeTruthy();
    }
  });
});
