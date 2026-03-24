import { Injectable } from "@nestjs/common";
import {
  BookingAuthorityMismatchType,
  BookingAuthorityReviewStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { BookingAuthorityQualityService } from "./booking-authority-quality.service";
import { BookingAuthorityDriftService } from "./booking-authority-drift.service";

export type AuthorityAlertSeverity = "low" | "medium" | "high";

const ACTION_BOOKING_CAP = 12;

/**
 * Deterministic, compact hints so operators can jump to bookings or admin surfaces.
 */
export type AuthorityAlertActionHints = {
  affectedBookingIds?: string[];
  relevantStatus?: BookingAuthorityReviewStatus;
  relevantTag?: string;
  relevantTagAxis?: "surface" | "problem" | "method";
  relevantMismatchType?: BookingAuthorityMismatchType;
  /** App-relative path in the web admin shell (informational). */
  suggestedAdminPath?: string;
};

export type AuthorityAlertItem = {
  alertType: string;
  severity: AuthorityAlertSeverity;
  evidenceSummary: string;
  windowUsed: { fromIso: string; toIso: string };
  details: Record<string, unknown>;
  /** Present when actionable references are available for this alert. */
  actionHints?: AuthorityAlertActionHints | null;
};

export type BookingAuthorityAlertsPayload = {
  kind: "booking_authority_alerts";
  generatedAt: string;
  windowUsed: { fromIso: string; toIso: string };
  thresholdsUsed: Record<string, number>;
  alerts: AuthorityAlertItem[];
};

@Injectable()
export class BookingAuthorityAlertService {
  constructor(
    private readonly db: PrismaService,
    private readonly quality: BookingAuthorityQualityService,
    private readonly drift: BookingAuthorityDriftService,
  ) {}

  private async listBookingIdsForAuthorityStatus(
    status: BookingAuthorityReviewStatus,
    updatedAtGte: Date,
  ): Promise<string[]> {
    const rows = await this.db.bookingAuthorityResult.findMany({
      where: { status, updatedAt: { gte: updatedAtGte } },
      select: { bookingId: true },
      orderBy: { updatedAt: "desc" },
      take: ACTION_BOOKING_CAP,
    });
    return rows.map((r) => r.bookingId);
  }

  private async listBookingIdsForMismatchType(
    mismatchType: BookingAuthorityMismatchType,
    createdAtGte: Date,
  ): Promise<string[]> {
    const rows = await this.db.bookingAuthorityMismatch.findMany({
      where: { mismatchType, createdAt: { gte: createdAtGte } },
      select: { bookingId: true },
      distinct: ["bookingId"],
      orderBy: { createdAt: "desc" },
      take: ACTION_BOOKING_CAP,
    });
    return rows.map((r) => r.bookingId);
  }

  private async listRecentMismatchBookingIds(createdAtGte: Date): Promise<string[]> {
    const rows = await this.db.bookingAuthorityMismatch.findMany({
      where: { createdAt: { gte: createdAtGte } },
      select: { bookingId: true },
      distinct: ["bookingId"],
      orderBy: { createdAt: "desc" },
      take: ACTION_BOOKING_CAP,
    });
    return rows.map((r) => r.bookingId);
  }

  async evaluateAlerts(options: {
    updatedAtGte: Date;
    toIso: Date;
    minSampleSize: number;
    overrideRateHighThreshold: number;
    reviewRateLowThreshold: number;
    mismatchTypeMinCount: number;
    unstableTagScoreMin: number;
    topLimit: number;
  }): Promise<BookingAuthorityAlertsPayload> {
    const { updatedAtGte, toIso } = options;
    const [qualityReport, driftReport] = await Promise.all([
      this.quality.buildQualityReport({
        updatedAtGte,
        topLimit: options.topLimit,
      }),
      this.drift.buildDriftSummary({
        updatedAtGte,
        topLimit: options.topLimit,
      }),
    ]);

    const thresholdsUsed: Record<string, number> = {
      minSampleSize: options.minSampleSize,
      overrideRateHighThreshold: options.overrideRateHighThreshold,
      reviewRateLowThreshold: options.reviewRateLowThreshold,
      mismatchTypeMinCount: options.mismatchTypeMinCount,
      unstableTagScoreMin: options.unstableTagScoreMin,
    };

    const windowUsed = {
      fromIso: updatedAtGte.toISOString(),
      toIso: toIso.toISOString(),
    };

    const alerts: AuthorityAlertItem[] = [];

    const baseWindow = () => ({ ...windowUsed });

    if (
      qualityReport.totalRecords >= options.minSampleSize &&
      qualityReport.overrideRate >= options.overrideRateHighThreshold
    ) {
      const affectedBookingIds = await this.listBookingIdsForAuthorityStatus(
        BookingAuthorityReviewStatus.overridden,
        updatedAtGte,
      );
      alerts.push({
        alertType: "override_rate_high",
        severity: "high",
        evidenceSummary: `Override rate ${(qualityReport.overrideRate * 100).toFixed(1)}% exceeds ${(options.overrideRateHighThreshold * 100).toFixed(0)}% with ${qualityReport.totalRecords} persisted rows in window.`,
        windowUsed: baseWindow(),
        details: {
          overrideRate: qualityReport.overrideRate,
          totalOverridden: qualityReport.totalOverridden,
          totalRecords: qualityReport.totalRecords,
        },
        actionHints: {
          affectedBookingIds,
          relevantStatus: BookingAuthorityReviewStatus.overridden,
          suggestedAdminPath: "/admin/authority/report",
        },
      });
    }

    if (
      qualityReport.totalRecords >= options.minSampleSize &&
      qualityReport.reviewRate <= options.reviewRateLowThreshold
    ) {
      const affectedBookingIds = await this.listBookingIdsForAuthorityStatus(
        BookingAuthorityReviewStatus.auto,
        updatedAtGte,
      );
      alerts.push({
        alertType: "review_rate_low",
        severity: "medium",
        evidenceSummary: `Review rate ${(qualityReport.reviewRate * 100).toFixed(1)}% is at or below ${(options.reviewRateLowThreshold * 100).toFixed(0)}% with ${qualityReport.totalRecords} persisted rows in window.`,
        windowUsed: baseWindow(),
        details: {
          reviewRate: qualityReport.reviewRate,
          totalReviewed: qualityReport.totalReviewed,
          totalRecords: qualityReport.totalRecords,
        },
        actionHints: {
          affectedBookingIds,
          relevantStatus: BookingAuthorityReviewStatus.auto,
          suggestedAdminPath: "/admin/authority/report",
        },
      });
    }

    for (const [mismatchTypeKey, count] of Object.entries(
      qualityReport.mismatchCountsByType,
    )) {
      if (count >= options.mismatchTypeMinCount) {
        const mismatchType = mismatchTypeKey as BookingAuthorityMismatchType;
        const affectedBookingIds =
          await this.listBookingIdsForMismatchType(mismatchType, updatedAtGte);
        alerts.push({
          alertType: "mismatch_type_spike",
          severity: count >= options.mismatchTypeMinCount * 2 ? "high" : "medium",
          evidenceSummary: `Mismatch type "${mismatchTypeKey}" occurred ${count} times in window (threshold ${options.mismatchTypeMinCount}).`,
          windowUsed: baseWindow(),
          details: { mismatchType: mismatchTypeKey, count },
          actionHints: {
            affectedBookingIds,
            relevantMismatchType: mismatchType,
            suggestedAdminPath: "/admin/authority/drift",
          },
        });
      }
    }

    const topUnstable = driftReport.topUnstableTags[0];
    if (
      topUnstable &&
      topUnstable.instabilityScore >= options.unstableTagScoreMin
    ) {
      const fromDrift = driftReport.bookingsWithRepeatedMismatchActivity
        .slice(0, ACTION_BOOKING_CAP)
        .map((b) => b.bookingId);
      const affectedBookingIds =
        fromDrift.length > 0
          ? fromDrift
          : await this.listRecentMismatchBookingIds(updatedAtGte);
      alerts.push({
        alertType: "unstable_tag_spike",
        severity:
          topUnstable.instabilityScore >= options.unstableTagScoreMin * 2
            ? "high"
            : "medium",
        evidenceSummary: `Tag "${topUnstable.tag}" (${topUnstable.axis}) instability score ${topUnstable.instabilityScore} (override bookings ${topUnstable.overrideBookings}, mismatch events ${topUnstable.mismatchEvents}).`,
        windowUsed: baseWindow(),
        details: { tag: topUnstable },
        actionHints: {
          affectedBookingIds,
          relevantTag: topUnstable.tag,
          relevantTagAxis: topUnstable.axis,
          suggestedAdminPath: "/admin/authority/drift",
        },
      });
    }

    const severityRank: Record<AuthorityAlertSeverity, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    alerts.sort((a, b) => {
      const dr = severityRank[a.severity] - severityRank[b.severity];
      if (dr !== 0) return dr;
      return a.alertType.localeCompare(b.alertType);
    });

    return {
      kind: "booking_authority_alerts",
      generatedAt: new Date().toISOString(),
      windowUsed,
      thresholdsUsed,
      alerts,
    };
  }
}
