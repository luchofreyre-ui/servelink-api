import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductResearchDecisionPanels } from "./ProductResearchDecisionPanels";
import { getProductResearch } from "@/lib/products/getProductResearch";

describe("ProductResearchDecisionPanels", () => {
  it("shows Best for, Avoid this if, verdict, and at least one best-use chip for CLR", () => {
    const research = getProductResearch("clr-calcium-lime-rust");
    expect(research).toBeTruthy();
    render(<ProductResearchDecisionPanels research={research!} />);

    expect(screen.getByText("Best for")).toBeInTheDocument();
    expect(screen.getByText("Avoid this if")).toBeInTheDocument();
    expect(
      screen.getByText(/A strong targeted descaler and rust remover with real value/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Use this instead of dish soap for calcium/i)).toBeInTheDocument();
  });
});
