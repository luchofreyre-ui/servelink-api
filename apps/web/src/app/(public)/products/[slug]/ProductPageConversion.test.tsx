import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductConversionLayer } from "./ProductConversionLayer";

describe("ProductConversionLayer", () => {
  it("renders authority-driven context and compare link for bona", () => {
    render(<ProductConversionLayer productSlug="bona-hard-surface-floor-cleaner" />);

    expect(screen.getByText(/Used for these problems/i)).toBeInTheDocument();
    expect(screen.getByText(/Why this works for your problem/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare with alternatives/i)).toBeInTheDocument();
  });

  it("renders only the stronger-option guidance for an unknown product", () => {
    render(<ProductConversionLayer productSlug="not-a-real-product" />);

    expect(screen.getByText(/If this doesn’t fully remove the buildup/i)).toBeInTheDocument();

    expect(screen.queryByText(/Used for these problems/i)).toBeNull();
    expect(screen.queryByText(/Why this works for your problem/i)).toBeNull();
    expect(screen.queryByText(/Compare with alternatives/i)).toBeNull();
  });
});
