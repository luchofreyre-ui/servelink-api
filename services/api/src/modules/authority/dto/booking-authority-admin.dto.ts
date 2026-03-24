import { BookingAuthorityResult, BookingAuthorityReviewStatus } from "@prisma/client";

/**
 * Admin API response for a persisted booking authority resolution row.
 * Includes ISO-8601 timestamps and review metadata for audit inspection (no separate audit log).
 */
export interface BookingAuthorityResultAdminResponseDto {
  id: string;
  bookingId: string;
  surfaces: string[];
  problems: string[];
  methods: string[];
  reasons: string[];
  resolutionVersion: number;
  status: BookingAuthorityReviewStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  /** Operator-supplied rationale when an admin override recorded reasons. */
  overrideReasons: string[] | null;
  createdAt: string;
  updatedAt: string;
}

function parseJsonStringArray(json: string): string[] {
  try {
    const v = JSON.parse(json) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

/** Slim row for admin list/review queues (tags + review metadata). */
export interface BookingAuthorityListItemDto {
  bookingId: string;
  surfaces: string[];
  problems: string[];
  methods: string[];
  status: BookingAuthorityReviewStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toBookingAuthorityListItem(
  row: BookingAuthorityResult,
): BookingAuthorityListItemDto {
  return {
    bookingId: row.bookingId,
    surfaces: parseJsonStringArray(row.surfacesJson),
    problems: parseJsonStringArray(row.problemsJson),
    methods: parseJsonStringArray(row.methodsJson),
    status: row.status,
    reviewedByUserId: row.reviewedByUserId,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toBookingAuthorityResultAdminResponse(
  row: BookingAuthorityResult,
): BookingAuthorityResultAdminResponseDto {
  return {
    id: row.id,
    bookingId: row.bookingId,
    surfaces: parseJsonStringArray(row.surfacesJson),
    problems: parseJsonStringArray(row.problemsJson),
    methods: parseJsonStringArray(row.methodsJson),
    reasons: parseJsonStringArray(row.reasonsJson),
    resolutionVersion: row.resolutionVersion,
    status: row.status,
    reviewedByUserId: row.reviewedByUserId,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    overrideReasons:
      row.overrideReasonsJson == null
        ? null
        : parseJsonStringArray(row.overrideReasonsJson),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
