import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeepCleanEstimatorImpactClient } from "./DeepCleanEstimatorImpactClient";

const mockFetch = vi.hoisted(() => vi.fn());
const mockToken = vi.hoisted(() => vi.fn(() => "test-token"));

vi.mock("@/lib/api/bookings", () => ({
  fetchAdminDeepCleanEstimatorImpact: mockFetch,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: mockToken,
}));

const impactResponse = {
  kind: "deep_clean_estimator_impact" as const,
  rows: [
    {
      estimatorConfigVersion: 1,
      estimatorConfigLabel: "v1-label",
      programCount: 2,
      usableProgramCount: 2,
      reviewedProgramCount: 2,
      averageVarianceMinutes: 10,
      averageVariancePercent: 10,
      underestimationTagCount: 1,
      overestimationTagCount: 0,
      estimatorIssueCount: 0,
      operationalIssueCount: 0,
      scopeIssueCount: 0,
      dataQualityIssueCount: 0,
      mixedIssueCount: 0,
      otherIssueCount: 1,
    },
    {
      estimatorConfigVersion: 2,
      estimatorConfigLabel: null,
      programCount: 1,
      usableProgramCount: 1,
      reviewedProgramCount: 1,
      averageVarianceMinutes: 5,
      averageVariancePercent: 5,
      underestimationTagCount: 0,
      overestimationTagCount: 0,
      estimatorIssueCount: 0,
      operationalIssueCount: 0,
      scopeIssueCount: 0,
      dataQualityIssueCount: 0,
      mixedIssueCount: 0,
      otherIssueCount: 0,
    },
  ],
  comparisons: [
    {
      baselineVersion: 1,
      comparisonVersion: 2,
      baselineAverageVariancePercent: 10,
      comparisonAverageVariancePercent: 5,
      deltaVariancePercent: -5,
      baselineAverageVarianceMinutes: 10,
      comparisonAverageVarianceMinutes: 5,
      deltaVarianceMinutes: -5,
    },
  ],
};

describe("DeepCleanEstimatorImpactClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("test-token");
  });

  it("shows sign-in message when no token", async () => {
    mockToken.mockReturnValue(null);
    mockFetch.mockResolvedValue(impactResponse);

    render(<DeepCleanEstimatorImpactClient />);

    await waitFor(() => {
      expect(screen.getByText(/sign in at \/admin\/auth/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("renders empty state when API returns no rows", async () => {
    mockFetch.mockResolvedValue({ kind: "deep_clean_estimator_impact", rows: [], comparisons: [] });

    render(<DeepCleanEstimatorImpactClient />);

    await waitFor(() => {
      expect(screen.getByTestId("deep-clean-estimator-impact-empty")).toBeInTheDocument();
    });
  });

  it("renders tables, comparison direction, interpretation, and cross-links", async () => {
    mockFetch.mockResolvedValue(impactResponse);

    render(<DeepCleanEstimatorImpactClient />);

    await waitFor(() => {
      expect(screen.getByTestId("deep-clean-estimator-impact-version-table")).toBeInTheDocument();
    });

    expect(screen.getByTestId("deep-clean-estimator-impact-link-analytics")).toHaveAttribute(
      "href",
      "/admin/deep-clean/analytics",
    );
    expect(screen.getByTestId("deep-clean-estimator-impact-link-insights")).toHaveAttribute(
      "href",
      "/admin/deep-clean/insights",
    );
    expect(screen.getByTestId("deep-clean-estimator-impact-link-estimator")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator",
    );
    expect(screen.getByTestId("deep-clean-estimator-impact-link-governance")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator-governance",
    );
    expect(screen.getByTestId("deep-clean-estimator-impact-link-governance-intel")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator-governance",
    );
    expect(screen.getByTestId("deep-clean-estimator-impact-link-monitoring")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator-monitoring",
    );

    expect(screen.getByTestId("deep-clean-estimator-impact-comparison-1-2")).toBeInTheDocument();
    expect(screen.getByTestId("deep-clean-estimator-impact-direction-improved")).toHaveTextContent("improved");
    expect(screen.getByTestId("deep-clean-estimator-impact-row-governance-1")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator-governance?version=1",
    );

    expect(screen.getByTestId("deep-clean-estimator-impact-interpretation")).toHaveTextContent(
      /Best observed version/i,
    );
  });

  it("refetches when reviewed-only filter is cleared", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(impactResponse);

    render(<DeepCleanEstimatorImpactClient />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const reviewedCb = screen.getByRole("checkbox", { name: /reviewed only/i });
    await user.click(reviewedCb);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]?.[0];
    expect(lastCall).toMatchObject({ reviewedOnly: false });
  });
});
