import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthorityDensityBridgeSummary } from "./AuthorityDensityBridgeSummary";

describe("AuthorityDensityBridgeSummary", () => {
  it("renders compact presentation labels for soap scum on shower glass", () => {
    render(<AuthorityDensityBridgeSummary surfaceSlug="shower-glass" problemSlug="soap-scum" />);

    const summary = screen.getByLabelText("Authority density summary");
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent("Test first · Strong match");
    expect(screen.getByText("Inspect · Name the soil · Test first")).toBeInTheDocument();
  });

  it("does not render raw bridge labels or internal enums", () => {
    render(<AuthorityDensityBridgeSummary surfaceSlug="shower-glass" problemSlug="soap-scum" />);

    const summaryText = screen.getByLabelText("Authority density summary").textContent ?? "";

    expect(summaryText).not.toContain("Severity:");
    expect(summaryText).not.toContain("Confidence:");
    expect(summaryText).not.toContain("Escalation:");
    expect(summaryText).not.toContain("Workflow:");
    expect(summaryText).not.toContain("restoration_boundary");
    expect(summaryText).not.toContain("visual_stop");
    expect(summaryText).not.toContain("workflow_safety");
    expect(summaryText).not.toContain("surface_risk");
    expect(summaryText).not.toContain("normalizedSeverity");
    expect(summaryText).not.toContain("normalizedConfidence");
  });

  it("renders nothing when bridge data is missing", () => {
    const { container } = render(
      <AuthorityDensityBridgeSummary surfaceSlug="missing-surface" problemSlug="missing-problem" />,
    );

    expect(screen.queryByLabelText("Authority density summary")).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});
