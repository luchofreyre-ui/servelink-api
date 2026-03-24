import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminAuthorityQualityClient } from "./AdminAuthorityQualityClient";

const mockQuality = vi.hoisted(() => vi.fn());
const mockDrift = vi.hoisted(() => vi.fn());
const mockFo = vi.hoisted(() => vi.fn());
const mockUnmapped = vi.hoisted(() => vi.fn());
const mockToken = vi.hoisted(() => vi.fn(() => "test-token"));

vi.mock("@/lib/api/adminAuthorityQuality", () => ({
  fetchAdminAuthorityQuality: mockQuality,
  fetchAdminAuthorityDrift: mockDrift,
}));

vi.mock("@/lib/api/adminAuthorityFoFeedback", () => ({
  fetchAdminFoAuthorityFeedbackSummary: mockFo,
}));

vi.mock("@/lib/api/adminAuthorityUnmappedTags", () => ({
  fetchAdminAuthorityUnmappedTags: mockUnmapped,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: mockToken,
}));

const sampleQuality = {
  kind: "booking_authority_quality_report" as const,
  generatedAt: "2025-03-01T12:00:00.000Z",
  totalRecords: 40,
  totalReviewed: 10,
  totalOverridden: 8,
  reviewRate: 0.25,
  overrideRate: 0.2,
  mismatchCountsByType: {
    incorrect_problem: 3,
    missing_surface: 1,
    missing_problem: 0,
    missing_method: 0,
    incorrect_surface: 0,
    incorrect_method: 0,
    over_tagging: 0,
    under_tagging: 0,
    other: 0,
  },
  topOverriddenProblems: [{ tag: "grease-buildup", bookingCount: 4 }],
  topOverriddenSurfaces: [{ tag: "tile", bookingCount: 3 }],
  topOverriddenMethods: [{ tag: "degreasing", bookingCount: 2 }],
};

const sampleDrift = {
  kind: "booking_authority_drift_summary" as const,
  generatedAt: "2025-03-01T12:00:00.000Z",
  tagsHighestOverrideFrequency: {
    problems: [{ tag: "grease-buildup", bookingCount: 4 }],
    surfaces: [],
    methods: [],
  },
  tagsHighestMismatchFrequency: {
    problems: [{ tag: "grease-buildup", bookingCount: 2 }],
    surfaces: [],
    methods: [],
  },
  bookingsWithRepeatedMismatchActivity: [
    { bookingId: "bk_repeat", mismatchCount: 3 },
  ],
  bookingsWithRepeatedResolutionActivity: [],
  recentOverrideTrendSummary: {
    authorityResultsOverriddenInScope: 8,
    mismatchRecordsCreatedInScope: 4,
  },
  mismatchTypeCountsInScope: {
    incorrect_problem: 1,
    missing_surface: 0,
    missing_problem: 0,
    missing_method: 0,
    incorrect_surface: 0,
    incorrect_method: 0,
    over_tagging: 0,
    under_tagging: 0,
    other: 0,
  },
  topUnstableTags: [
    {
      axis: "problem",
      tag: "grease-buildup",
      overrideBookings: 4,
      mismatchEvents: 2,
      instabilityScore: 6,
    },
  ],
};

const sampleFo = {
  kind: "fo_authority_feedback_admin_summary" as const,
  generatedAt: "2025-03-01T12:00:00.000Z",
  windowUsed: { fromIso: "2025-02-01T00:00:00.000Z", toIso: "2025-03-01T12:00:00.000Z" },
  totalCount: 4,
  helpfulCount: 3,
  notHelpfulCount: 1,
  undecidedCount: 0,
  helpfulRate: 0.75,
  recent: [
    {
      id: "fb1",
      bookingId: "bk_fb_1",
      helpful: true,
      selectedKnowledgePath: "/problems/x",
      notes: null,
      createdAt: "2025-03-01T10:00:00.000Z",
    },
  ],
  topSelectedKnowledgePaths: [{ path: "/problems/x", feedbackCount: 2 }],
};

const sampleUnmapped = {
  kind: "booking_authority_unmapped_tags" as const,
  generatedAt: "2025-03-01T12:00:00.000Z",
  windowUsed: { fromIso: "2025-02-01T00:00:00.000Z", toIso: "2025-03-01T12:00:00.000Z" },
  rowsScanned: 10,
  maxRowsScan: 400,
  items: [{ axis: "surface", tag: "unknown-surf", bookingCount: 1 }],
};

describe("AdminAuthorityQualityClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("test-token");
  });

  it("shows sign-in message when no token", async () => {
    mockToken.mockReturnValue(null);
    render(<AdminAuthorityQualityClient />);
    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-quality-error")).toHaveTextContent(
        /sign in at \/admin\/auth/i,
      );
    });
    expect(mockQuality).not.toHaveBeenCalled();
  });

  it("renders loading then quality + drift panels", async () => {
    mockQuality.mockResolvedValue(sampleQuality);
    mockDrift.mockResolvedValue(sampleDrift);
    mockFo.mockResolvedValue(sampleFo);
    mockUnmapped.mockResolvedValue(sampleUnmapped);

    render(<AdminAuthorityQualityClient />);

    expect(screen.getByTestId("admin-authority-quality-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-quality-summary")).toBeInTheDocument();
    });

    expect(mockQuality).toHaveBeenCalled();
    expect(mockDrift).toHaveBeenCalled();

    expect(screen.getByText("25.0%")).toBeInTheDocument();
    expect(screen.getByText("20.0%")).toBeInTheDocument();
    expect(screen.getByText("incorrect_problem")).toBeInTheDocument();
    expect(screen.getByTestId("admin-authority-quality-drift")).toBeInTheDocument();
    expect(screen.getByText("bk_repeat")).toBeInTheDocument();
    expect(screen.getByTestId("admin-authority-quality-instability-nudge")).toBeInTheDocument();
    expect(screen.getByTestId("admin-authority-quality-nudge-drift")).toHaveAttribute(
      "href",
      "/admin/authority/drift?windowHours=168",
    );
    expect(screen.getByTestId("admin-authority-quality-nudge-alerts")).toHaveAttribute(
      "href",
      "/admin/authority/alerts?windowHours=168",
    );
    expect(screen.getByTestId("admin-authority-quality-fo-feedback-recent")).toBeInTheDocument();
    expect(screen.getByTestId("admin-authority-quality-unmapped-list")).toBeInTheDocument();
  });

  it("shows empty copy when no persisted authority rows", async () => {
    mockFo.mockResolvedValue({ ...sampleFo, totalCount: 0, recent: [], helpfulRate: null });
    mockUnmapped.mockResolvedValue({ ...sampleUnmapped, items: [] });
    mockQuality.mockResolvedValue({
      ...sampleQuality,
      totalRecords: 0,
      totalReviewed: 0,
      totalOverridden: 0,
      reviewRate: 0,
      overrideRate: 0,
      topOverriddenProblems: [],
      topOverriddenSurfaces: [],
      topOverriddenMethods: [],
    });
    mockDrift.mockResolvedValue(sampleDrift);

    render(<AdminAuthorityQualityClient />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-quality-empty")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-quality-fo-feedback-empty")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-quality-unmapped-empty")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("admin-authority-quality-instability-nudge")).not.toBeInTheDocument();
  });
});
