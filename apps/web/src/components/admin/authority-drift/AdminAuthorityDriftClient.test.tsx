import { render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminAuthorityDriftClient } from "./AdminAuthorityDriftClient";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const mockDrift = vi.hoisted(() => vi.fn());
const mockToken = vi.hoisted(() => vi.fn(() => "test-token"));

vi.mock("@/lib/api/adminAuthorityQuality", () => ({
  fetchAdminAuthorityDrift: mockDrift,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: mockToken,
}));

const sample = {
  kind: "booking_authority_drift_summary" as const,
  generatedAt: "2025-03-01T12:00:00.000Z",
  tagsHighestOverrideFrequency: {
    problems: [{ tag: "p1", bookingCount: 2 }],
    surfaces: [],
    methods: [],
  },
  tagsHighestMismatchFrequency: {
    problems: [{ tag: "p1", bookingCount: 1 }],
    surfaces: [],
    methods: [],
  },
  bookingsWithRepeatedMismatchActivity: [],
  bookingsWithRepeatedResolutionActivity: [],
  recentOverrideTrendSummary: {
    authorityResultsOverriddenInScope: 2,
    mismatchRecordsCreatedInScope: 1,
  },
  mismatchTypeCountsInScope: { incorrect_problem: 2, other: 0 },
  topUnstableTags: [
    {
      axis: "problem",
      tag: "p1",
      overrideBookings: 2,
      mismatchEvents: 1,
      instabilityScore: 3,
    },
  ],
};

describe("AdminAuthorityDriftClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("test-token");
  });

  it("renders drift tables after load", async () => {
    mockDrift.mockResolvedValue(sample);
    render(
      <Suspense fallback={null}>
        <AdminAuthorityDriftClient />
      </Suspense>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-drift-unstable")).toBeInTheDocument();
    });
    expect(mockDrift).toHaveBeenCalledWith(
      expect.any(String),
      "test-token",
      expect.objectContaining({ topLimit: 20, windowHours: 168 }),
    );
    expect(screen.getByTestId("admin-authority-drift-crosslinks")).toBeInTheDocument();
    expect(screen.getByTestId("admin-authority-drift-link-quality")).toHaveAttribute(
      "href",
      "/admin/authority/quality",
    );
    expect(screen.getByTestId("admin-authority-drift-link-alerts")).toHaveAttribute(
      "href",
      "/admin/authority/alerts",
    );
    expect(screen.getAllByText("p1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("incorrect_problem")).toBeInTheDocument();
  });
});
