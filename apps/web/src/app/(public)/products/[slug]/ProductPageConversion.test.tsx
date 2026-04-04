import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductConversionLayer } from "@/components/products/ProductConversionLayer";

describe("product page conversion layer", () => {
  it("renders problem context and compare link when available", () => {
    render(<ProductConversionLayer productSlug="bona-hard-surface-floor-cleaner" />);

    expect(screen.getByText(/Why this works for your problem/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare with alternatives/i)).toBeInTheDocument();
  });
});
