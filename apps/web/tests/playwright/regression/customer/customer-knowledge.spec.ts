import {
  customerBookingDetailPath,
  customerDashboardPath,
  expect,
  openCustomerAuthedPath,
  test,
} from "../../fixtures/customer.fixture";
import { knowledgeTestIds } from "../../selectors/knowledge";

test.describe("customer knowledge", () => {
  test("customer dashboard shows encyclopedia entry card", async ({ page, customerToken }) => {
    await openCustomerAuthedPath(page, customerToken, customerDashboardPath());

    const card = page.getByTestId(knowledgeTestIds.customerDashboardKnowledgeCard);
    await expect(card).toBeVisible();
    await expect(card.getByRole("heading", { name: /cleaning encyclopedia/i })).toBeVisible();
  });

  test("customer dashboard recommendations block appears when scenario summary supports it", async ({
    page,
    customerToken,
  }) => {
    await openCustomerAuthedPath(page, customerToken, customerDashboardPath());

    const recs = page.getByTestId(knowledgeTestIds.customerDashboardRecommendations);
    if ((await recs.count()) === 0) {
      test.info().annotations.push({
        type: "note",
        description:
          "No recommendations for this scenario (needs deep_clean service, pets, and/or sqft_band-derived homeSize in customer screen-summary rows).",
      });
      return;
    }

    await expect(recs).toBeVisible();
    await expect(recs.getByRole("heading", { name: /recommended for your home/i })).toBeVisible();
    const firstLink = recs.locator("a[href]").first();
    await expect(firstLink).toBeVisible();
  });

  test('customer booking detail shows "Need cleaning guidance?"', async ({
    page,
    customerToken,
    customerBookingIds,
  }) => {
    const bookingId = customerBookingIds.active;
    await openCustomerAuthedPath(
      page,
      customerToken,
      customerBookingDetailPath(bookingId),
    );

    const card = page.getByTestId(knowledgeTestIds.customerBookingKnowledgeCard);
    await expect(card).toBeVisible();
    await expect(card.getByRole("heading", { name: /need cleaning guidance\?/i })).toBeVisible();
  });

  test("dashboard knowledge links go to /search and /encyclopedia", async ({
    page,
    customerToken,
  }) => {
    await openCustomerAuthedPath(page, customerToken, customerDashboardPath());

    const card = page.getByTestId(knowledgeTestIds.customerDashboardKnowledgeCard);
    await expect(card.locator('a[href="/search"]')).toHaveCount(1);
    await expect(card.locator('a[href="/encyclopedia"]')).toHaveCount(1);
  });

  test("booking detail knowledge links go to /search and /encyclopedia", async ({
    page,
    customerToken,
    customerBookingIds,
  }) => {
    const bookingId = customerBookingIds.active;
    await openCustomerAuthedPath(
      page,
      customerToken,
      customerBookingDetailPath(bookingId),
    );

    const card = page.getByTestId(knowledgeTestIds.customerBookingKnowledgeCard);
    await expect(card.locator('a[href="/search"]')).toHaveCount(1);
    await expect(card.locator('a[href="/encyclopedia"]')).toHaveCount(1);
  });
});
