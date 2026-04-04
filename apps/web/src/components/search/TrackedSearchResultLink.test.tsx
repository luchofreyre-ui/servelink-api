import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TrackedSearchResultLink from "./TrackedSearchResultLink";

const { trackProductRecommendationClick } = vi.hoisted(() => ({
  trackProductRecommendationClick: vi.fn(),
}));

vi.mock("@/lib/products/trackProductRecommendationClick", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/products/trackProductRecommendationClick")>();
  return {
    ...actual,
    trackProductRecommendationClick,
  };
});

describe("TrackedSearchResultLink", () => {
  beforeEach(() => {
    trackProductRecommendationClick.mockClear();
  });

  it("tracks compare result clicks with position and injected pin state", () => {
    render(
      <TrackedSearchResultLink
        index={1}
        result={{
          id: "cmp-1",
          title: "Compare Bona vs Zep",
          href: "/compare/products/bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner",
          type: "product_comparison",
          source: "injected",
          score: 9990,
        } as any}
      >
        Compare Bona vs Zep
      </TrackedSearchResultLink>,
    );

    fireEvent.click(screen.getByText("Compare Bona vs Zep"));

    expect(trackProductRecommendationClick).toHaveBeenCalledTimes(1);
    expect(trackProductRecommendationClick.mock.calls[0][0]).toMatchObject({
      destinationType: "compare",
      sourcePageType: "search",
      pageType: "search_results_page",
      position: 1,
      isPinned: true,
    });
  });

  it("tracks product clicks as internal product links", () => {
    render(
      <TrackedSearchResultLink
        index={2}
        result={{
          id: "prd-1",
          title: "Bona Hard-Surface Floor Cleaner",
          href: "/products/bona-hard-surface-floor-cleaner",
          type: "product",
          source: "injected",
          score: 9980,
        } as any}
      >
        Bona Hard-Surface Floor Cleaner
      </TrackedSearchResultLink>,
    );

    fireEvent.click(screen.getByText("Bona Hard-Surface Floor Cleaner"));

    expect(trackProductRecommendationClick).toHaveBeenCalledTimes(1);
    expect(trackProductRecommendationClick.mock.calls[0][0]).toMatchObject({
      destinationType: "internal_product",
      sourcePageType: "search",
      pageType: "search_results_page",
      position: 2,
      isPinned: true,
      productSlug: "bona-hard-surface-floor-cleaner",
    });
  });
});
