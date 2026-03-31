import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  getResolutionPreviewSummary,
  SystemTestsResolutionPreview,
} from "../SystemTestsResolutionPreview";
import type { SystemTestResolutionPreview } from "@/types/systemTestResolution";

function basePreview(
  overrides: Partial<SystemTestResolutionPreview> = {},
): SystemTestResolutionPreview {
  return {
    hasResolution: true,
    category: "timing_issue",
    confidence: 0.82,
    confidenceLabel: "High confidence",
    topRecommendationSummary: "Wait for network idle before asserting.",
    recommendationCount: 1,
    diagnosisSummary: "Async settle detected.",
    highestPriority: "high",
    ...overrides,
  };
}

describe("getResolutionPreviewSummary", () => {
  it("returns null when preview is null", () => {
    expect(getResolutionPreviewSummary(null)).toBeNull();
  });

  it("returns null when hasResolution is false", () => {
    expect(
      getResolutionPreviewSummary({
        hasResolution: false,
        category: null,
        confidence: null,
        confidenceLabel: null,
        topRecommendationSummary: "x",
        recommendationCount: 0,
        diagnosisSummary: null,
        highestPriority: null,
      }),
    ).toBeNull();
  });

  it("prefers recommendation over diagnosis", () => {
    expect(getResolutionPreviewSummary(basePreview())).toBe("Wait for network idle before asserting.");
  });

  it("falls back to diagnosis when recommendation missing", () => {
    expect(
      getResolutionPreviewSummary(
        basePreview({ topRecommendationSummary: null }),
      ),
    ).toBe("Async settle detected.");
  });
});

describe("SystemTestsResolutionPreview", () => {
  it("renders empty state when preview is null", () => {
    render(<SystemTestsResolutionPreview preview={null} />);
    expect(screen.getByTestId("system-tests-resolution-preview-empty")).toHaveTextContent(
      "No fix preview",
    );
  });

  it("renders custom empty label when preview unusable", () => {
    render(
      <SystemTestsResolutionPreview
        preview={{ ...basePreview(), hasResolution: false }}
        emptyLabel="Nothing yet"
      />,
    );
    expect(screen.getByTestId("system-tests-resolution-preview-empty")).toHaveTextContent(
      "Nothing yet",
    );
  });

  it("renders category and confidence label", () => {
    render(<SystemTestsResolutionPreview preview={basePreview()} />);
    expect(screen.getByText("timing issue")).toBeInTheDocument();
    expect(screen.getByText("High confidence")).toBeInTheDocument();
  });

  it("renders recommendation summary", () => {
    render(<SystemTestsResolutionPreview preview={basePreview()} />);
    expect(screen.getByTestId("system-tests-resolution-preview-summary")).toHaveTextContent(
      "Wait for network idle before asserting.",
    );
  });

  it("falls back to diagnosis summary when recommendation missing", () => {
    render(
      <SystemTestsResolutionPreview
        preview={basePreview({ topRecommendationSummary: null })}
      />,
    );
    expect(screen.getByTestId("system-tests-resolution-preview-summary")).toHaveTextContent(
      "Async settle detected.",
    );
  });

  it("renders +N more when recommendationCount > 1", () => {
    render(<SystemTestsResolutionPreview preview={basePreview({ recommendationCount: 4 })} />);
    expect(screen.getByTestId("system-tests-resolution-preview-more")).toHaveTextContent("+3 more");
  });

  it("renders View fix link when href provided", () => {
    render(
      <SystemTestsResolutionPreview
        preview={basePreview()}
        href="/admin/system-tests/families/abc"
      />,
    );
    const link = screen.getByTestId("system-tests-resolution-preview-link");
    expect(link).toHaveAttribute("href", "/admin/system-tests/families/abc");
    expect(link).toHaveTextContent("View fix");
  });
});
