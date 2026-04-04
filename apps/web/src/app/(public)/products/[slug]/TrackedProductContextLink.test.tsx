import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TrackedProductContextBuyLink } from "./TrackedProductContextBuyLink";
import { TrackedProductContextLink } from "./TrackedProductContextLink";

const trackSpy = vi.hoisted(() => vi.fn());

vi.mock("@/lib/products/trackProductRecommendationClick", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/products/trackProductRecommendationClick")>();

  return {
    ...actual,
    trackProductRecommendationClick: (...args: unknown[]) => trackSpy(...args),
  };
});

describe("product context tracking", () => {
  beforeEach(() => {
    trackSpy.mockClear();
  });

  it("tracks problem chip clicks", () => {
    render(
      <TrackedProductContextLink
        href="/problems/dust-buildup"
        productSlug="bona-hard-surface-floor-cleaner"
        roleLabel="product_problem_chip"
        position={0}
        label="product_context_chip:dust-buildup:position_0"
      >
        Dust buildup
      </TrackedProductContextLink>,
    );

    fireEvent.click(screen.getByText("Dust buildup"));

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy.mock.calls[0][0]).toMatchObject({
      productSlug: "bona-hard-surface-floor-cleaner",
      sourcePageType: "product",
      pageType: "product_page",
      position: 0,
      isPinned: true,
      label: "product_context_chip:dust-buildup:position_0",
    });
  });

  it("tracks compare link clicks", () => {
    render(
      <TrackedProductContextLink
        href="/compare/products/bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner"
        productSlug="bona-hard-surface-floor-cleaner"
        roleLabel="comparison_entry"
        position={10}
        label="product_context_compare:bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner"
      >
        Compare with alternatives →
      </TrackedProductContextLink>,
    );

    fireEvent.click(screen.getByText(/Compare with alternatives/i));

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy.mock.calls[0][0]).toMatchObject({
      destinationType: "compare",
      sourcePageType: "product",
      pageType: "product_page",
      position: 10,
    });
  });

  it("tracks buy re-entry clicks", () => {
    render(
      <TrackedProductContextBuyLink
        href="https://www.amazon.com/dp/TESTASIN?tag=YOUR_TAG"
        productSlug="bona-hard-surface-floor-cleaner"
        position={11}
        label="product_context_buy:bona-hard-surface-floor-cleaner"
      >
        Buy this option →
      </TrackedProductContextBuyLink>,
    );

    fireEvent.click(screen.getByText(/Buy this option/i));

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy.mock.calls[0][0]).toMatchObject({
      destinationUrl: "https://www.amazon.com/dp/TESTASIN?tag=YOUR_TAG",
      sourcePageType: "product",
      pageType: "product_page",
      position: 11,
      label: "product_context_buy:bona-hard-surface-floor-cleaner",
    });
  });
});
