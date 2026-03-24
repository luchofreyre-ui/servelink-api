import { Injectable } from "@nestjs/common";
import {
  BookingAuthorityMismatchType,
  BookingAuthorityReviewStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { parseAuthorityStringArrayJson } from "./booking-authority-json.util";
import type { AuthorityQualityTagCount } from "./booking-authority-quality.service";

export type UnstableTagSignal = {
  axis: "surface" | "problem" | "method";
  tag: string;
  /** Bookings (overridden rows in scope) carrying this tag. */
  overrideBookings: number;
  /** Mismatch records in scope whose linked result carried this tag (one bump per mismatch row). */
  mismatchEvents: number;
  /** `overrideBookings + mismatchEvents` — higher means more operator + learning friction. */
  instabilityScore: number;
};

export type BookingRepeatedMismatchRow = {
  bookingId: string;
  mismatchCount: number;
};

export type BookingResolutionActivityRow = {
  bookingId: string;
  resolutionVersion: number;
  status: BookingAuthorityReviewStatus;
};

export type AuthorityDriftSummaryPayload = {
  kind: "booking_authority_drift_summary";
  generatedAt: string;
  scopeUpdatedAtMin?: string;
  tagsHighestOverrideFrequency: {
    problems: AuthorityQualityTagCount[];
    surfaces: AuthorityQualityTagCount[];
    methods: AuthorityQualityTagCount[];
  };
  /** Tags on authority results that co-occur with mismatch records (weighted by mismatch count). */
  tagsHighestMismatchFrequency: {
    problems: AuthorityQualityTagCount[];
    surfaces: AuthorityQualityTagCount[];
    methods: AuthorityQualityTagCount[];
  };
  bookingsWithRepeatedMismatchActivity: BookingRepeatedMismatchRow[];
  /**
   * Persisted rows with `resolutionVersion >= 2` and status `overridden` in scope —
   * indicates multiple resolver cycles before the current override.
   */
  bookingsWithRepeatedResolutionActivity: BookingResolutionActivityRow[];
  recentOverrideTrendSummary: {
    authorityResultsOverriddenInScope: number;
    mismatchRecordsCreatedInScope: number;
  };
  /** Mismatch rows grouped by type within the same time scope as other drift fields. */
  mismatchTypeCountsInScope: Record<string, number>;
  /**
   * Tags ranked by combined override + mismatch pressure (deterministic: score desc, axis, tag asc).
   */
  topUnstableTags: UnstableTagSignal[];
};

function bumpTagCounts(
  map: Map<string, number>,
  tags: string[],
  delta: number,
) {
  for (const tag of new Set(tags)) {
    map.set(tag, (map.get(tag) ?? 0) + delta);
  }
}

function toSortedTopFromMap(
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

function emptyMismatchTypeCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of Object.values(BookingAuthorityMismatchType)) {
    if (typeof v === "string") out[v] = 0;
  }
  return out;
}

function buildTopUnstableTags(params: {
  overrideSurfaceCounts: Map<string, number>;
  overrideProblemCounts: Map<string, number>;
  overrideMethodCounts: Map<string, number>;
  mismatchSurfaceCounts: Map<string, number>;
  mismatchProblemCounts: Map<string, number>;
  mismatchMethodCounts: Map<string, number>;
  limit: number;
}): UnstableTagSignal[] {
  const keys = new Set<string>();
  const addKeys = (m: Map<string, number>, axis: UnstableTagSignal["axis"]) => {
    for (const tag of m.keys()) {
      keys.add(`${axis}:${tag}`);
    }
  };
  addKeys(params.overrideSurfaceCounts, "surface");
  addKeys(params.overrideProblemCounts, "problem");
  addKeys(params.overrideMethodCounts, "method");
  addKeys(params.mismatchSurfaceCounts, "surface");
  addKeys(params.mismatchProblemCounts, "problem");
  addKeys(params.mismatchMethodCounts, "method");

  const out: UnstableTagSignal[] = [];
  for (const key of keys) {
    const ci = key.indexOf(":");
    if (ci <= 0) continue;
    const axis = key.slice(0, ci);
    const tag = key.slice(ci + 1);
    const ax = axis as UnstableTagSignal["axis"];
    if (ax !== "surface" && ax !== "problem" && ax !== "method") continue;

    const oSurf = params.overrideSurfaceCounts.get(tag) ?? 0;
    const oProb = params.overrideProblemCounts.get(tag) ?? 0;
    const oMeth = params.overrideMethodCounts.get(tag) ?? 0;
    const mSurf = params.mismatchSurfaceCounts.get(tag) ?? 0;
    const mProb = params.mismatchProblemCounts.get(tag) ?? 0;
    const mMeth = params.mismatchMethodCounts.get(tag) ?? 0;

    let overrideBookings = 0;
    let mismatchEvents = 0;
    if (ax === "surface") {
      overrideBookings = oSurf;
      mismatchEvents = mSurf;
    } else if (ax === "problem") {
      overrideBookings = oProb;
      mismatchEvents = mProb;
    } else {
      overrideBookings = oMeth;
      mismatchEvents = mMeth;
    }

    const instabilityScore = overrideBookings + mismatchEvents;
    if (instabilityScore <= 0) continue;

    out.push({
      axis: ax,
      tag,
      overrideBookings,
      mismatchEvents,
      instabilityScore,
    });
  }

  return out
    .sort((a, b) => {
      if (b.instabilityScore !== a.instabilityScore) {
        return b.instabilityScore - a.instabilityScore;
      }
      if (a.axis !== b.axis) return a.axis.localeCompare(b.axis);
      return a.tag.localeCompare(b.tag);
    })
    .slice(0, params.limit);
}

@Injectable()
export class BookingAuthorityDriftService {
  constructor(private readonly db: PrismaService) {}

  async buildDriftSummary(options: {
    updatedAtGte?: Date;
    topLimit: number;
  }): Promise<AuthorityDriftSummaryPayload> {
    const resultWhere =
      options.updatedAtGte != null
        ? { updatedAt: { gte: options.updatedAtGte } }
        : {};

    const mismatchWhere =
      options.updatedAtGte != null
        ? { createdAt: { gte: options.updatedAtGte } }
        : {};

    const topLimit = options.topLimit;

    const [
      overriddenRows,
      mismatchesInScope,
      mismatchBookingGroups,
      mismatchTypeGroups,
      resolutionHeavy,
      overriddenCount,
      mismatchCount,
    ] = await Promise.all([
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
      this.db.bookingAuthorityMismatch.findMany({
        where: mismatchWhere,
        select: { authorityResultId: true },
      }),
      this.db.bookingAuthorityMismatch.groupBy({
        by: ["bookingId"],
        where: mismatchWhere,
        _count: { _all: true },
      }),
      this.db.bookingAuthorityMismatch.groupBy({
        by: ["mismatchType"],
        where: mismatchWhere,
        _count: { _all: true },
      }),
      this.db.bookingAuthorityResult.findMany({
        where: {
          ...resultWhere,
          status: BookingAuthorityReviewStatus.overridden,
          resolutionVersion: { gte: 2 },
        },
        select: {
          bookingId: true,
          resolutionVersion: true,
          status: true,
        },
        orderBy: [{ resolutionVersion: "desc" }, { bookingId: "asc" }],
        take: 50,
      }),
      this.db.bookingAuthorityResult.count({
        where: {
          ...resultWhere,
          status: BookingAuthorityReviewStatus.overridden,
        },
      }),
      this.db.bookingAuthorityMismatch.count({ where: mismatchWhere }),
    ]);

    const overrideProblemCounts = new Map<string, number>();
    const overrideSurfaceCounts = new Map<string, number>();
    const overrideMethodCounts = new Map<string, number>();
    for (const row of overriddenRows) {
      bumpTagCounts(
        overrideSurfaceCounts,
        parseAuthorityStringArrayJson(row.surfacesJson),
        1,
      );
      bumpTagCounts(
        overrideProblemCounts,
        parseAuthorityStringArrayJson(row.problemsJson),
        1,
      );
      bumpTagCounts(
        overrideMethodCounts,
        parseAuthorityStringArrayJson(row.methodsJson),
        1,
      );
    }

    const mismatchProblemCounts = new Map<string, number>();
    const mismatchSurfaceCounts = new Map<string, number>();
    const mismatchMethodCounts = new Map<string, number>();

    const uniqueResultIds = [
      ...new Set(mismatchesInScope.map((m) => m.authorityResultId)),
    ];
    if (uniqueResultIds.length > 0) {
      const results = await this.db.bookingAuthorityResult.findMany({
        where: { id: { in: uniqueResultIds } },
        select: {
          id: true,
          surfacesJson: true,
          problemsJson: true,
          methodsJson: true,
        },
      });
      const byId = new Map(results.map((r) => [r.id, r]));
      for (const m of mismatchesInScope) {
        const r = byId.get(m.authorityResultId);
        if (!r) continue;
        bumpTagCounts(
          mismatchSurfaceCounts,
          parseAuthorityStringArrayJson(r.surfacesJson),
          1,
        );
        bumpTagCounts(
          mismatchProblemCounts,
          parseAuthorityStringArrayJson(r.problemsJson),
          1,
        );
        bumpTagCounts(
          mismatchMethodCounts,
          parseAuthorityStringArrayJson(r.methodsJson),
          1,
        );
      }
    }

    const repeatedMismatchBookings = mismatchBookingGroups
      .filter((g) => g._count._all >= 2)
      .map((g) => ({
        bookingId: g.bookingId,
        mismatchCount: g._count._all,
      }))
      .sort((a, b) => {
        if (b.mismatchCount !== a.mismatchCount) {
          return b.mismatchCount - a.mismatchCount;
        }
        return a.bookingId.localeCompare(b.bookingId);
      })
      .slice(0, 50);

    const mismatchTypeCountsInScope = emptyMismatchTypeCounts();
    for (const g of mismatchTypeGroups) {
      mismatchTypeCountsInScope[g.mismatchType] = g._count._all;
    }

    const topUnstableTags = buildTopUnstableTags({
      overrideSurfaceCounts,
      overrideProblemCounts,
      overrideMethodCounts,
      mismatchSurfaceCounts,
      mismatchProblemCounts,
      mismatchMethodCounts,
      limit: topLimit,
    });

    return {
      kind: "booking_authority_drift_summary",
      generatedAt: new Date().toISOString(),
      ...(options.updatedAtGte
        ? { scopeUpdatedAtMin: options.updatedAtGte.toISOString() }
        : {}),
      tagsHighestOverrideFrequency: {
        problems: toSortedTopFromMap(overrideProblemCounts, topLimit),
        surfaces: toSortedTopFromMap(overrideSurfaceCounts, topLimit),
        methods: toSortedTopFromMap(overrideMethodCounts, topLimit),
      },
      tagsHighestMismatchFrequency: {
        problems: toSortedTopFromMap(mismatchProblemCounts, topLimit),
        surfaces: toSortedTopFromMap(mismatchSurfaceCounts, topLimit),
        methods: toSortedTopFromMap(mismatchMethodCounts, topLimit),
      },
      bookingsWithRepeatedMismatchActivity: repeatedMismatchBookings,
      bookingsWithRepeatedResolutionActivity: resolutionHeavy.map((r) => ({
        bookingId: r.bookingId,
        resolutionVersion: r.resolutionVersion,
        status: r.status,
      })),
      recentOverrideTrendSummary: {
        authorityResultsOverriddenInScope: overriddenCount,
        mismatchRecordsCreatedInScope: mismatchCount,
      },
      mismatchTypeCountsInScope,
      topUnstableTags,
    };
  }
}
