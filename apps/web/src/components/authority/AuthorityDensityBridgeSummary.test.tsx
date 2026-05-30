import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthorityDensityBridgeSummary } from "./AuthorityDensityBridgeSummary";

describe("AuthorityDensityBridgeSummary", () => {
  it("renders compact density data for soap scum on shower glass", () => {
    render(<AuthorityDensityBridgeSummary surfaceSlug="shower-glass" problemSlug="soap-scum" />);

    const summary = screen.getByLabelText("Authority density summary");
    expect(summary).toBeInTheDocument();
    expect(screen.getByText("Severity: Moderate")).toBeInTheDocument();
    expect(screen.getByText("Confidence: High")).toBeInTheDocument();
    expect(screen.getByText(/Escalation:/)).toBeInTheDocument();
    expect(screen.getByText("Workflow: Inspect, Identify, Pretest")).toBeInTheDocument();
  });

  it("renders nothing when bridge data is missing", () => {
    const { container } = render(
      <AuthorityDensityBridgeSummary surfaceSlug="missing-surface" problemSlug="missing-problem" />,
    );

    expect(screen.queryByLabelText("Authority density summary")).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});
