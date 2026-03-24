import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeepCleanInsightsClient } from "./DeepCleanInsightsClient";

const mockFetch = vi.hoisted(() => vi.fn());
const mockToken = vi.hoisted(() => vi.fn(() => "test-token"));

vi.mock("@/lib/api/bookings", () => ({
  fetchAdminDeepCleanInsights: mockFetch,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: mockToken,
}));

const sampleResponse = {
  kind: "deep_clean_insights" as const,
  summary: {
    totalReviewedPrograms: 4,
    reviewedEstimatorIssuePrograms: 2,
    reviewedOperationalIssuePrograms: 1,
    reviewedScopeIssuePrograms: 1,
    averageReviewedVarianceMinutes: 12,
    averageReviewedVariancePercent: 15,
  },
  reasonTagRows: [
    {
      reasonTag: "underestimation",
      reviewedCount: 3,
      averageVarianceMinutes: 20,
      averageVariancePercent: 25,
      averageEstimatedTotalDurationMinutes: 100,
      averageActualTotalDurationMinutes: 120,
    },
    {
      reasonTag: "operator_inefficiency",
      reviewedCount: 1,
      averageVarianceMinutes: 5,
      averageVariancePercent: 4,
      averageEstimatedTotalDurationMinutes: 100,
      averageActualTotalDurationMinutes: 104,
    },
  ],
  programTypeRows: [
    {
      programType: "single_visit_deep_clean",
      reviewedCount: 2,
      usableCount: 2,
      averageVarianceMinutes: 10,
      averageVariancePercent: 8,
    },
    {
      programType: "phased_deep_clean_program",
      reviewedCount: 2,
      usableCount: 2,
      averageVarianceMinutes: 14,
      averageVariancePercent: 22,
    },
  ],
  feedbackBuckets: [
    { bucket: "estimator_issue", count: 2 },
    { bucket: "operational_issue", count: 1 },
    { bucket: "scope_issue", count: 1 },
    { bucket: "data_quality_issue", count: 0 },
    { bucket: "mixed", count: 0 },
    { bucket: "other", count: 0 },
  ],
};

describe("DeepCleanInsightsClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("test-token");
  });

  it("shows sign-in message when no token", async () => {
    mockToken.mockReturnValue(null);
    mockFetch.mockResolvedValue(sampleResponse);

    render(<DeepCleanInsightsClient />);

    await waitFor(() => {
      expect(screen.getByText(/sign in at \/admin\/auth/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("renders summary, buckets, top reasons, program comparison, interpretation, and analytics link", async () => {
    mockFetch.mockResolvedValue(sampleResponse);

    render(<DeepCleanInsightsClient />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /deep clean insights/i })).toBeInTheDocument();
    });

    expect(screen.getByText("Reviewed programs").closest("div.rounded-xl")).toHaveTextContent("4");
    expect(screen.getByRole("heading", { name: /feedback buckets/i })).toBeInTheDocument();
    expect(screen.getByTestId("deep-clean-insights-bucket-estimator_issue")).toHaveTextContent("2");
    const topReasonsSection = screen.getByRole("heading", { name: /top review reasons/i }).closest("section");
    expect(topReasonsSection).toBeTruthy();
    expect(within(topReasonsSection!).getByText("Underestimation")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /program type comparison/i })).toBeInTheDocument();
    expect(screen.getByTestId("deep-clean-insights-interpretation")).toBeInTheDocument();
    expect(screen.getByTestId("deep-clean-insights-link-analytics")).toHaveAttribute(
      "href",
      "/admin/deep-clean/analytics",
    );
    expect(screen.getByTestId("deep-clean-insights-link-estimator-impact")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator-impact",
    );
  });

  it("refetches when program type filter changes", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(sampleResponse);

    render(<DeepCleanInsightsClient />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const programSelect = screen.getByRole("combobox", { name: /program type/i });
    await user.selectOptions(programSelect, "three_visit");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.objectContaining({ programType: "three_visit" }),
      );
    });
  });

  it("refetches when feedback bucket filter changes", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(sampleResponse);

    render(<DeepCleanInsightsClient />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const bucketSelect = screen.getByRole("combobox", { name: /feedback bucket/i });
    await user.selectOptions(bucketSelect, "mixed");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith(expect.objectContaining({ feedbackBucket: "mixed" }));
    });
  });
});
