import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeepCleanAnalyticsClient } from "./DeepCleanAnalyticsClient";

const mockFetch = vi.hoisted(() => vi.fn());
const mockUpdateReview = vi.hoisted(() => vi.fn());
const mockToken = vi.hoisted(() => vi.fn(() => "test-token"));

vi.mock("@/lib/api/bookings", () => ({
  fetchAdminDeepCleanAnalytics: mockFetch,
  updateAdminDeepCleanCalibrationReview: mockUpdateReview,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: mockToken,
}));

const sampleResponse = {
  kind: "deep_clean_analytics" as const,
  summary: {
    totalProgramCalibrations: 2,
    usableProgramCalibrations: 1,
    fullyCompletedPrograms: 2,
    programsWithOperatorNotes: 1,
    averageVarianceMinutes: 5,
    averageVariancePercent: 10,
    averageEstimatedTotalDurationMinutes: 100,
    averageActualTotalDurationMinutes: 105,
  },
  rows: [
    {
      bookingId: "booking-alpha",
      programId: "prog-1",
      programType: "single_visit_deep_clean",
      estimatedTotalDurationMinutes: 100,
      actualTotalDurationMinutes: 130,
      durationVarianceMinutes: 30,
      durationVariancePercent: 30,
      totalVisits: 1,
      completedVisits: 1,
      isFullyCompleted: true,
      hasAnyOperatorNotes: true,
      usableForCalibrationAnalysis: true,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
    },
    {
      bookingId: "booking-beta",
      programId: "prog-2",
      programType: "phased_deep_clean_program",
      estimatedTotalDurationMinutes: 200,
      actualTotalDurationMinutes: 180,
      durationVarianceMinutes: -20,
      durationVariancePercent: -10,
      totalVisits: 3,
      completedVisits: 3,
      isFullyCompleted: true,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: false,
      reviewStatus: "unreviewed" as const,
      reviewedAt: null,
      reviewReasonTags: [],
      reviewNote: null,
      createdAt: "2025-01-03T00:00:00.000Z",
      updatedAt: "2025-01-04T00:00:00.000Z",
    },
  ],
};

describe("DeepCleanAnalyticsClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("test-token");
  });

  it("shows sign-in message when no token", async () => {
    mockToken.mockReturnValue(null);
    mockFetch.mockResolvedValue(sampleResponse);

    render(<DeepCleanAnalyticsClient />);

    await waitFor(() => {
      expect(screen.getByText(/sign in at \/admin\/auth/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("renders summary and table rows with booking links", async () => {
    mockFetch.mockResolvedValue(sampleResponse);

    render(<DeepCleanAnalyticsClient />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /deep clean analytics/i })).toBeInTheDocument();
    });

    expect(screen.getByTestId("deep-clean-analytics-link-insights")).toHaveAttribute(
      "href",
      "/admin/deep-clean/insights",
    );
    expect(screen.getByTestId("deep-clean-analytics-link-estimator")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator",
    );
    expect(screen.getByTestId("deep-clean-analytics-link-estimator-impact")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator-impact",
    );

    const totalCard = screen.getByText("Total calibrations").closest("div.rounded-xl");
    expect(totalCard).toHaveTextContent("2");
    expect(
      screen.getByText("Usable for calibration", { exact: true }).closest("div.rounded-xl"),
    ).toHaveTextContent("1");

    const alphaLink = await screen.findByRole("link", { name: "booking-alpha" });
    expect(alphaLink).toHaveAttribute("href", "/admin/bookings/booking-alpha");

    expect(screen.getByRole("heading", { level: 2, name: "Needs review" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Highest overruns" })).toBeInTheDocument();
  });

  it("refetches when review filter changes", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(sampleResponse);

    render(<DeepCleanAnalyticsClient />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const reviewSelect = screen.getByRole("combobox", { name: /review status/i });
    await user.selectOptions(reviewSelect, "reviewed");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.objectContaining({ reviewStatus: "reviewed" }),
      );
    });
  });

  it("refetches when reason tag filter changes", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(sampleResponse);

    render(<DeepCleanAnalyticsClient />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const tagSelect = screen.getByRole("combobox", { name: /reason tag/i });
    await user.selectOptions(tagSelect, "scope_anomaly");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.objectContaining({ reasonTag: "scope_anomaly" }),
      );
    });
  });

  it("refetches when filters change", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(sampleResponse);

    render(<DeepCleanAnalyticsClient />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const usable = screen.getByRole("checkbox", { name: /usable only/i });
    await user.click(usable);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.objectContaining({ usableOnly: true }),
      );
    });
  });
});
