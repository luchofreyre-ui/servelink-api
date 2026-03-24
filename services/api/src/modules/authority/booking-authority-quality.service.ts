import { Injectable } from "@nestjs/common";
import {
  BookingAuthorityMismatchType,
  BookingAuthorityReviewStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { parseAuthorityStringArrayJson } from "./booking-authority-json.util";

export type AuthorityQualityTagCount = {
  tag: string;
  bookingCount: number;
};

export type AuthorityQualityReportPayload = {
  kind: "booking_authority_quality_report";
  generatedAt: string;
  scopeUpdatedAtMin?: string;
  totalRecords: number;
  totalReviewed: number;
  totalOverridden: number;
  /** `totalReviewed / totalRecords`, 0 when totalRecords is 0. */
  reviewRate: number;
  /** `totalOverridden / totalRecords`, 0 when totalRecords is 0. */
  overrideRate: number;
  mismatchCountsByType: Record<string, number>;
  topOverriddenProblems: AuthorityQualityTagCount[];
  topOverriddenSurfaces: AuthorityQualityTagCount[];
  topOverriddenMethods: AuthorityQualityTagCount[];
};

function emptyMismatchCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of Object.values(BookingAuthorityMismatchType)) {
    if (typeof v === "string") {
      out[v] = 0;
    }
  }
  return out;
}

function countBookingsPerTag(
  rows: { surfacesJson: string; problemsJson: string; methodsJson: string }[],
  field: "surfacesJson" | "problemsJson" | "methodsJson",
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const tags = parseAuthorityStringArrayJson(row[field]);
    for (const tag of new Set(tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

function toSortedTop(
  counts: Map<string, number>,
  limit: number,
): AuthorityQualityTagCount[] {
  return [...counts.entries()]
    .map(([tag, bookingCount]) => ({ tag, bookingCount }))
    .sort((a, b) => {
      if (b.bookingCount !== a.bookingCount) {
        return b.bookingCount - a.bookingCount;
      }
      return a.tag.localeCompare(b.tag);
    })
    .slice(0, limit);
}

@Injectable()
export class BookingAuthorityQualityService {
  constructor(private readonly db: PrismaService) {}

  async buildQualityReport(options: {
    updatedAtGte?: Date;
    topLimit: number;
  }): Promise<AuthorityQualityReportPayload> {
    const resultWhere =
      options.updatedAtGte != null
        ? { updatedAt: { gte: options.updatedAtGte } }
        : {};

    const mismatchWhere =
      options.updatedAtGte != null
        ? { createdAt: { gte: options.updatedAtGte } }
        : {};

    const [statusGroups, totalRecords, overriddenRows, mismatchGroups] =
      await Promise.all([
        this.db.bookingAuthorityResult.groupBy({
          by: ["status"],
          where: resultWhere,
          _count: { _all: true },
        }),
        this.db.bookingAuthorityResult.count({ where: resultWhere }),
        this.db.bookingAuthorityResult.findMany({
          where: {
            ...resultWhere,
            status: BookingAuthorityReviewStatus.overridden,
          },
          select: {
            surfacesJson: true,
            problemsJson: true,
            methodsJson: true,
          },
        }),
        this.db.bookingAuthorityMismatch.groupBy({
          by: ["mismatchType"],
          where: mismatchWhere,
          _count: { _all: true },
        }),
      ]);

    const countsByStatus: Record<BookingAuthorityReviewStatus, number> = {
      [BookingAuthorityReviewStatus.auto]: 0,
      [BookingAuthorityReviewStatus.reviewed]: 0,
      [BookingAuthorityReviewStatus.overridden]: 0,
    };
    for (const row of statusGroups) {
      countsByStatus[row.status] = row._count._all;
    }

    const totalReviewed = countsByStatus[BookingAuthorityReviewStatus.reviewed];
    const totalOverridden =
      countsByStatus[BookingAuthorityReviewStatus.overridden];

    const reviewRate =
      totalRecords > 0 ? totalReviewed / totalRecords : 0;
    const overrideRate =
      totalRecords > 0 ? totalOverridden / totalRecords : 0;

    const mismatchCountsByType = emptyMismatchCounts();
    for (const row of mismatchGroups) {
      mismatchCountsByType[row.mismatchType] = row._count._all;
    }

    const topLimit = options.topLimit;
    const topOverriddenSurfaces = toSortedTop(
      countBookingsPerTag(overriddenRows, "surfacesJson"),
      topLimit,
    );
    const topOverriddenProblems = toSortedTop(
      countBookingsPerTag(overriddenRows, "problemsJson"),
      topLimit,
    );
    const topOverriddenMethods = toSortedTop(
      countBookingsPerTag(overriddenRows, "methodsJson"),
      topLimit,
    );

    return {
      kind: "booking_authority_quality_report",
      generatedAt: new Date().toISOString(),
      ...(options.updatedAtGte
        ? { scopeUpdatedAtMin: options.updatedAtGte.toISOString() }
        : {}),
      totalRecords,
      totalReviewed,
      totalOverridden,
      reviewRate,
      overrideRate,
      mismatchCountsByType,
      topOverriddenProblems,
      topOverriddenSurfaces,
      topOverriddenMethods,
    };
  }
}
