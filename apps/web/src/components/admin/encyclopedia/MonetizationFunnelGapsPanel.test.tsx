import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MonetizationFunnelGapsPanel from "./MonetizationFunnelGapsPanel";

describe("MonetizationFunnelGapsPanel", () => {
  it("renders OK line when there are no gaps", () => {
    render(
      <MonetizationFunnelGapsPanel
        monetizationGaps={[]}
        monetizationGapLines={["OK: no monetization funnel gaps detected."]}
      />,
    );
    expect(screen.getByText("Monetization funnel gaps")).toBeInTheDocument();
    expect(
      screen.getByText("No monetization gaps detected across the tracked execution-first hubs."),
    ).toBeInTheDocument();
    expect(screen.getByText("OK: no monetization funnel gaps detected.")).toBeInTheDocument();
  });

  it("renders a single gap line and count", () => {
    render(
      <MonetizationFunnelGapsPanel
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
    expect(screen.getByText("1 gap(s) detected across tracked hubs.")).toBeInTheDocument();
    expect(screen.getByText("x | missing_compare | test")).toBeInTheDocument();
  });
});
