import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MonetizationHealthDashboard from "./MonetizationHealthDashboard";

describe("MonetizationHealthDashboard", () => {
  it("shows no gaps when list is empty", () => {
    render(<MonetizationHealthDashboard monetizationGaps={[]} />);
    expect(screen.getByText(/No gaps/i)).toBeInTheDocument();
    expect(screen.getByText(/Gap count: 0/)).toBeInTheDocument();
  });

  it("shows gaps detected when gaps exist", () => {
    render(
      <MonetizationHealthDashboard
        monetizationGaps={[
          {
            problemSlug: "x",
            code: "missing_compare",
            detail: "test",
          },
        ]}
      />,
    );
    expect(screen.getByText(/Gaps detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Gap count: 1/)).toBeInTheDocument();
  });
});
