import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ProductResearchCollapsibleDetail } from "./ProductResearchCollapsibleDetail";

describe("ProductResearchCollapsibleDetail", () => {
  it("shows toggle; detailed content is hidden until expanded", async () => {
    const user = userEvent.setup();
    render(
      <ProductResearchCollapsibleDetail>
        <p>Expert bullet detail</p>
      </ProductResearchCollapsibleDetail>,
    );

    expect(screen.getByTestId("product-research-detail-toggle")).toHaveTextContent("Show detailed analysis");
    expect(screen.queryByText("Expert bullet detail")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("product-research-detail-toggle"));

    expect(screen.getByTestId("product-research-detail-toggle")).toHaveTextContent("Hide detailed analysis");
    expect(screen.getByText("Expert bullet detail")).toBeInTheDocument();
  });
});
