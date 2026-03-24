import { Injectable } from "@nestjs/common";
import { BookingAuthorityReviewStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { parseAuthorityStringArrayJson } from "./booking-authority-json.util";

export type BookingAuthorityReportTagCount = {
  tag: string;
  bookingCount: number;
};

export type BookingAuthorityReportRecentItem = {
  bookingId: string;
  status: BookingAuthorityReviewStatus;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingAuthorityReportPayload = {
  kind: "booking_authority_report";
  generatedAt: string;
  /**
   * When set, all aggregates and lists only include rows with `updatedAt >= scopeUpdatedAtMin`.
   * Omitted when the report uses the full table (default).
   */
  scopeUpdatedAtMin?: string;
  /** Total persisted `BookingAuthorityResult` rows included in aggregates. */
  totalRecords: number;
  /** Counts keyed by review status (persisted rows only). */
  countsByStatus: Record<BookingAuthorityReviewStatus, number>;
  topProblems: BookingAuthorityReportTagCount[];
  topSurfaces: BookingAuthorityReportTagCount[];
  topMethods: BookingAuthorityReportTagCount[];
  /** Omitted when `recentLimit` is 0. Newest `reviewedAt` first; nulls sort last. */
  recentReviewedOrOverridden?: BookingAuthorityReportRecentItem[];
};

type TagProjection = {
  surfacesJson: string;
  problemsJson: string;
  methodsJson: string;
};

function countBookingsPerTag(
  rows: TagProjection[],
  field: keyof Pick<TagProjection, "surfacesJson" | "problemsJson" | "methodsJson">,
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

/**
 * Deterministic ordering: descending `bookingCount`, then ascending `tag` (localeCompare).
 */
function toSortedTop(
  counts: Map<string, number>,
  limit: number,
): BookingAuthorityReportTagCount[] {
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
export class BookingAuthorityReportingService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Aggregates only persisted `BookingAuthorityResult` rows (no runtime resolver).
   * Optional `updatedAtGte` scopes every aggregate and the recent list to that window.
   */
  async buildPersistedReport(options: {
    topLimit: number;
    recentLimit: number;
    /** When set, only rows with `updatedAt >= updatedAtGte` are included. */
    updatedAtGte?: Date;
  }): Promise<BookingAuthorityReportPayload> {
    const timeWhere =
      options.updatedAtGte != null
        ? { updatedAt: { gte: options.updatedAtGte } }
        : {};

    const [statusGroups, tagRows, totalRecords] = await Promise.all([
      this.db.bookingAuthorityResult.groupBy({
        by: ["status"],
        where: timeWhere,
        _count: { _all: true },
      }),
      this.db.bookingAuthorityResult.findMany({
        where: timeWhere,
        select: {
          surfacesJson: true,
          problemsJson: true,
          methodsJson: true,
        },
      }),
      this.db.bookingAuthorityResult.count({ where: timeWhere }),
    ]);

    const countsByStatus: Record<BookingAuthorityReviewStatus, number> = {
      [BookingAuthorityReviewStatus.auto]: 0,
      [BookingAuthorityReviewStatus.reviewed]: 0,
      [BookingAuthorityReviewStatus.overridden]: 0,
    };
    for (const row of statusGroups) {
      countsByStatus[row.status] = row._count._all;
    }

    const topLimit = options.topLimit;
    const topSurfaces = toSortedTop(
      countBookingsPerTag(tagRows, "surfacesJson"),
      topLimit,
    );
    const topProblems = toSortedTop(
      countBookingsPerTag(tagRows, "problemsJson"),
      topLimit,
    );
    const topMethods = toSortedTop(
      countBookingsPerTag(tagRows, "methodsJson"),
      topLimit,
    );

    const base: BookingAuthorityReportPayload = {
      kind: "booking_authority_report",
      generatedAt: new Date().toISOString(),
      ...(options.updatedAtGte
        ? { scopeUpdatedAtMin: options.updatedAtGte.toISOString() }
        : {}),
      totalRecords,
      countsByStatus,
      topProblems,
      topSurfaces,
      topMethods,
    };

    if (options.recentLimit <= 0) {
      return base;
    }

    const recentRows = await this.db.bookingAuthorityResult.findMany({
      where: {
        ...timeWhere,
        status: {
          in: [
            BookingAuthorityReviewStatus.reviewed,
            BookingAuthorityReviewStatus.overridden,
          ],
        },
        reviewedAt: { not: null },
      },
      orderBy: [{ reviewedAt: "desc" }, { bookingId: "asc" }],
      take: options.recentLimit,
      select: {
        bookingId: true,
        status: true,
        reviewedAt: true,
        reviewedByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...base,
      recentReviewedOrOverridden: recentRows.map((r) => ({
        bookingId: r.bookingId,
        status: r.status,
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
        reviewedByUserId: r.reviewedByUserId,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }
}
