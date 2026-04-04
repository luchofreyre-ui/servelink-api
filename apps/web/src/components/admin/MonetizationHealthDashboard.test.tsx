import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MonetizationHealthDashboard } from "./MonetizationHealthDashboard";

describe("MonetizationHealthDashboard", () => {
  it("shows healthy when no gaps", () => {
    render(
      <MonetizationHealthDashboard monetizationGaps={[]} monetizationGapLines={["OK: no monetization funnel gaps detected."]} />,
    );
    expect(screen.getByText(/Healthy/i)).toBeInTheDocument();
  });

  it("shows issues when gaps exist", () => {
    render(
      <MonetizationHealthDashboard
        monetizationGaps={[
          {
            problemSlug: "x",
            code: "missing_compare",
            detail: "test",
          },
        ]}
        monetizationGapLines={["x | missing_compare | test"]}
      />,
    );
    expect(screen.getByText(/Issues detected/i)).toBeInTheDocument();
    expect(screen.getByText(/x \| missing_compare \| test/)).toBeInTheDocument();
  });
});
