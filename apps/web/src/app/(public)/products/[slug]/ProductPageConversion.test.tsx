import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductConversionLayer } from "./ProductConversionLayer";

describe("ProductConversionLayer", () => {
  it("renders reinforced product-page funnel elements for bona", () => {
    render(<ProductConversionLayer productSlug="bona-hard-surface-floor-cleaner" />);

    expect(screen.getByText(/Used for these problems/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Go straight to the exact cleaning problem this product is used for/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Why this works for your problem/i)).toBeInTheDocument();
    expect(screen.getByText(/Not fully sure yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare with alternatives/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready to move forward/i)).toBeInTheDocument();
    expect(screen.getByText(/Buy this option/i)).toBeInTheDocument();
    expect(screen.getByText(/Buy this product now/i)).toBeInTheDocument();
  });

  it("renders only stronger-option guidance for an unknown product", () => {
    render(<ProductConversionLayer productSlug="not-a-real-product" />);

    expect(screen.getByText(/If this doesn’t fully remove the buildup/i)).toBeInTheDocument();

    expect(screen.queryByText(/Used for these problems/i)).toBeNull();
    expect(screen.queryByText(/Why this works for your problem/i)).toBeNull();
    expect(screen.queryByText(/Not fully sure yet/i)).toBeNull();
    expect(screen.queryByText(/Compare with alternatives/i)).toBeNull();
    expect(screen.queryByText(/Ready to move forward/i)).toBeNull();
    expect(screen.queryByText(/Buy this option/i)).toBeNull();
    expect(screen.queryByText(/Buy this product now/i)).toBeNull();
  });
});
