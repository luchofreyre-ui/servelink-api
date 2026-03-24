import { Test } from "@nestjs/testing";
import {
  BookingAuthorityMismatchType,
  BookingAuthorityReviewStatus,
} from "@prisma/client";
import { PrismaService } from "../src/prisma";
import { BookingAuthorityAlertService } from "../src/modules/authority/booking-authority-alert.service";
import { BookingAuthorityQualityService } from "../src/modules/authority/booking-authority-quality.service";
import { BookingAuthorityDriftService } from "../src/modules/authority/booking-authority-drift.service";

describe("BookingAuthorityAlertService", () => {
  const quality = {
    buildQualityReport: jest.fn(),
  };
  const drift = {
    buildDriftSummary: jest.fn(),
  };

  const prisma = {
    bookingAuthorityResult: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    bookingAuthorityMismatch: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  let service: BookingAuthorityAlertService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.bookingAuthorityResult.findMany.mockResolvedValue([]);
    prisma.bookingAuthorityMismatch.findMany.mockResolvedValue([]);
    const modRef = await Test.createTestingModule({
      providers: [
        BookingAuthorityAlertService,
        { provide: BookingAuthorityQualityService, useValue: quality },
        { provide: BookingAuthorityDriftService, useValue: drift },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = modRef.get(BookingAuthorityAlertService);
  });

  const from = new Date("2025-01-01T00:00:00.000Z");
  const to = new Date("2025-01-08T00:00:00.000Z");

  const emptyMismatchCounts = () => ({
    missing_surface: 0,
    missing_problem: 0,
    missing_method: 0,
    incorrect_surface: 0,
    incorrect_problem: 0,
    incorrect_method: 0,
    over_tagging: 0,
    under_tagging: 0,
    other: 0,
  });

  it("returns no alerts when metrics are calm", async () => {
    quality.buildQualityReport.mockResolvedValue({
      kind: "booking_authority_quality_report",
      generatedAt: to.toISOString(),
      totalRecords: 20,
      totalReviewed: 5,
      totalOverridden: 2,
      reviewRate: 0.25,
      overrideRate: 0.1,
      mismatchCountsByType: emptyMismatchCounts(),
      topOverriddenProblems: [],
      topOverriddenSurfaces: [],
      topOverriddenMethods: [],
    });
    drift.buildDriftSummary.mockResolvedValue({
      kind: "booking_authority_drift_summary",
      generatedAt: to.toISOString(),
      tagsHighestOverrideFrequency: { problems: [], surfaces: [], methods: [] },
      tagsHighestMismatchFrequency: { problems: [], surfaces: [], methods: [] },
      bookingsWithRepeatedMismatchActivity: [],
      bookingsWithRepeatedResolutionActivity: [],
      recentOverrideTrendSummary: {
        authorityResultsOverriddenInScope: 2,
        mismatchRecordsCreatedInScope: 0,
      },
      mismatchTypeCountsInScope: emptyMismatchCounts(),
      topUnstableTags: [],
    });

    const out = await service.evaluateAlerts({
      updatedAtGte: from,
      toIso: to,
      minSampleSize: 10,
      overrideRateHighThreshold: 0.5,
      reviewRateLowThreshold: 0.01,
      mismatchTypeMinCount: 50,
      unstableTagScoreMin: 100,
      topLimit: 20,
    });

    expect(out.kind).toBe("booking_authority_alerts");
    expect(out.alerts).toHaveLength(0);
    expect(out.windowUsed.fromIso).toBe(from.toISOString());
    expect(out.windowUsed.toIso).toBe(to.toISOString());
    expect(out.thresholdsUsed.minSampleSize).toBe(10);
  });

  it("fires alerts with deterministic actionHints and stable ordering", async () => {
    prisma.bookingAuthorityResult.findMany.mockImplementation(
      (args: { where?: { status?: BookingAuthorityReviewStatus } }) => {
        if (args.where?.status === BookingAuthorityReviewStatus.overridden) {
          return Promise.resolve([{ bookingId: "ov1" }, { bookingId: "ov2" }]);
        }
        if (args.where?.status === BookingAuthorityReviewStatus.auto) {
          return Promise.resolve([{ bookingId: "au1" }]);
        }
        return Promise.resolve([]);
      },
    );
    prisma.bookingAuthorityMismatch.findMany.mockResolvedValue([
      { bookingId: "mm1" },
    ]);

    quality.buildQualityReport.mockResolvedValue({
      kind: "booking_authority_quality_report",
      generatedAt: to.toISOString(),
      totalRecords: 10,
      totalReviewed: 0,
      totalOverridden: 8,
      reviewRate: 0,
      overrideRate: 0.8,
      mismatchCountsByType: {
        ...emptyMismatchCounts(),
        incorrect_problem: 12,
      },
      topOverriddenProblems: [],
      topOverriddenSurfaces: [],
      topOverriddenMethods: [],
    });
    drift.buildDriftSummary.mockResolvedValue({
      kind: "booking_authority_drift_summary",
      generatedAt: to.toISOString(),
      tagsHighestOverrideFrequency: { problems: [], surfaces: [], methods: [] },
      tagsHighestMismatchFrequency: { problems: [], surfaces: [], methods: [] },
      bookingsWithRepeatedMismatchActivity: [{ bookingId: "dr1", mismatchCount: 3 }],
      bookingsWithRepeatedResolutionActivity: [],
      recentOverrideTrendSummary: {
        authorityResultsOverriddenInScope: 8,
        mismatchRecordsCreatedInScope: 12,
      },
      mismatchTypeCountsInScope: emptyMismatchCounts(),
      topUnstableTags: [
        {
          axis: "problem" as const,
          tag: "grease-buildup",
          overrideBookings: 10,
          mismatchEvents: 10,
          instabilityScore: 20,
        },
      ],
    });

    const out = await service.evaluateAlerts({
      updatedAtGte: from,
      toIso: to,
      minSampleSize: 5,
      overrideRateHighThreshold: 0.5,
      reviewRateLowThreshold: 0.05,
      mismatchTypeMinCount: 8,
      unstableTagScoreMin: 10,
      topLimit: 20,
    });

    const types = out.alerts.map((a) => a.alertType);
    expect(types).toContain("override_rate_high");
    expect(types).toContain("review_rate_low");
    expect(types).toContain("mismatch_type_spike");
    expect(types).toContain("unstable_tag_spike");

    const ov = out.alerts.find((a) => a.alertType === "override_rate_high");
    expect(ov?.actionHints?.affectedBookingIds).toEqual(["ov1", "ov2"]);
    expect(ov?.actionHints?.relevantStatus).toBe(
      BookingAuthorityReviewStatus.overridden,
    );
    expect(ov?.actionHints?.suggestedAdminPath).toBe("/admin/authority/report");

    const mm = out.alerts.find((a) => a.alertType === "mismatch_type_spike");
    expect(mm?.actionHints?.relevantMismatchType).toBe(
      BookingAuthorityMismatchType.incorrect_problem,
    );
    expect(mm?.actionHints?.affectedBookingIds).toEqual(["mm1"]);

    const un = out.alerts.find((a) => a.alertType === "unstable_tag_spike");
    expect(un?.actionHints?.relevantTag).toBe("grease-buildup");
    expect(un?.actionHints?.relevantTagAxis).toBe("problem");
    expect(un?.actionHints?.affectedBookingIds).toContain("dr1");

    expect(out.alerts.some((a) => a.severity === "high")).toBe(true);
    for (const a of out.alerts) {
      expect(a.windowUsed.fromIso).toBe(from.toISOString());
      expect(a.windowUsed.toIso).toBe(to.toISOString());
      expect(typeof a.evidenceSummary).toBe("string");
      expect(a.details).toBeDefined();
      expect(a.actionHints).toBeDefined();
    }
  });
});
