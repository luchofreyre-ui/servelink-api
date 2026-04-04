import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RelatedProducts from "./RelatedProducts";

describe("RelatedProducts", () => {
  it("lists comparison opponent first when a compare route exists for the current product", () => {
    const { container } = render(
      <RelatedProducts
        product={{
          slug: "bona-hard-surface-floor-cleaner",
          name: "Bona Hard-Surface Floor Cleaner",
          finalScore: 8,
          compatibleProblems: ["dust buildup"],
        }}
        mode="similar"
        trackingContext={{ pageType: "product_page", sourcePageType: "related_products" }}
      />,
    );

    const firstProductDetailLink = container.querySelector('.grid a[href^="/products/"]');
    expect(firstProductDetailLink?.getAttribute("href")).toBe("/products/zep-neutral-ph-floor-cleaner");
  });
});
