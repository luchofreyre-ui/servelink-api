import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TrackedSearchResultLink from "./TrackedSearchResultLink";

const trackSpy = vi.hoisted(() => vi.fn());

vi.mock("@/lib/products/trackProductRecommendationClick", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/products/trackProductRecommendationClick")>();

  return {
    ...actual,
    trackProductRecommendationClick: (...args: unknown[]) => trackSpy(...args),
  };
});

describe("TrackedSearchResultLink analytics", () => {
  beforeEach(() => {
    trackSpy.mockClear();
  });

  it("tracks a top injected compare title click with the correct label", () => {
    render(
      <TrackedSearchResultLink
        index={0}
        clickSurface="title"
        result={
          {
            id: "cmp-top",
            title: "Compare Bona vs Zep",
            href: "/compare/products/bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner",
            type: "product_comparison",
            source: "injected",
            score: 9990,
          } as any
        }
      >
        Compare Bona vs Zep
      </TrackedSearchResultLink>,
    );

    fireEvent.click(screen.getByText("Compare Bona vs Zep"));

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy.mock.calls[0][0]).toMatchObject({
      position: 0,
      isPinned: true,
      sourcePageType: "search",
      pageType: "search_results_page",
      label:
        "search_result_click:product_comparison:injected:title:top_result:position_0",
    });
  });

  it("tracks an organic product open-page click with the correct label", () => {
    render(
      <TrackedSearchResultLink
        index={2}
        clickSurface="open_page"
        result={
          {
            id: "prd-2",
            title: "Bona Hard-Surface Floor Cleaner",
            href: "/products/bona-hard-surface-floor-cleaner",
            type: "product",
            source: "encyclopedia",
            score: 120,
          } as any
        }
      >
        Open page
      </TrackedSearchResultLink>,
    );

    fireEvent.click(screen.getByText("Open page"));

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy.mock.calls[0][0]).toMatchObject({
      position: 2,
      isPinned: false,
      sourcePageType: "search",
      pageType: "search_results_page",
      label:
        "search_result_click:product:organic:open_page:non_top_result:position_2",
    });
  });

  it("tracks an authority problem title click as authority_problem", () => {
    render(
      <TrackedSearchResultLink
        index={0}
        clickSurface="title"
        result={
          {
            id: "auth-1",
            title: "Dust buildup",
            href: "/problems/dust-buildup",
            type: "problem",
            source: "authority",
            score: 10000,
          } as any
        }
      >
        Dust buildup
      </TrackedSearchResultLink>,
    );

    fireEvent.click(screen.getByText("Dust buildup"));

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy.mock.calls[0][0]).toMatchObject({
      label:
        "search_result_click:authority_problem:organic:title:top_result:position_0",
    });
  });
});
