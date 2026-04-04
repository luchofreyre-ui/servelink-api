import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductPurchaseActions } from "./ProductPurchaseActions";

describe("ProductPurchaseActions", () => {
  it("suppresses Amazon buy when no purchase URL and still shows internal details", () => {
    render(
      <ProductPurchaseActions
        product={{ slug: "not-a-real-product-slug", name: "Unknown" }}
        viewHref="/products/not-a-real-product-slug"
      />,
    );

    expect(screen.queryByRole("link", { name: /View on Amazon|Buy on Amazon/i })).toBeNull();
    expect(screen.getByRole("link", { name: /Full details/i })).toHaveAttribute(
      "href",
      "/products/not-a-real-product-slug",
    );
  });
});
