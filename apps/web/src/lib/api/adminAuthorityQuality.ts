import type { BookingAuthorityReviewStatus } from "@/lib/api/adminBookingCommandCenter";

export type AuthorityQualityTagRow = {
  tag: string;
  bookingCount: number;
};

export type BookingAuthorityQualityPayload = {
  kind: "booking_authority_quality_report";
  generatedAt: string;
  scopeUpdatedAtMin?: string;
  totalRecords: number;
  totalReviewed: number;
  totalOverridden: number;
  reviewRate: number;
  overrideRate: number;
  mismatchCountsByType: Record<string, number>;
  topOverriddenProblems: AuthorityQualityTagRow[];
  topOverriddenSurfaces: AuthorityQualityTagRow[];
  topOverriddenMethods: AuthorityQualityTagRow[];
};

export type BookingAuthorityDriftPayload = {
  kind: "booking_authority_drift_summary";
  generatedAt: string;
  scopeUpdatedAtMin?: string;
  tagsHighestOverrideFrequency: {
    problems: AuthorityQualityTagRow[];
    surfaces: AuthorityQualityTagRow[];
    methods: AuthorityQualityTagRow[];
  };
  tagsHighestMismatchFrequency: {
    problems: AuthorityQualityTagRow[];
    surfaces: AuthorityQualityTagRow[];
    methods: AuthorityQualityTagRow[];
  };
  bookingsWithRepeatedMismatchActivity: {
    bookingId: string;
    mismatchCount: number;
  }[];
  bookingsWithRepeatedResolutionActivity: {
    bookingId: string;
    resolutionVersion: number;
    status: BookingAuthorityReviewStatus;
  }[];
  recentOverrideTrendSummary: {
    authorityResultsOverriddenInScope: number;
    mismatchRecordsCreatedInScope: number;
  };
  mismatchTypeCountsInScope: Record<string, number>;
  topUnstableTags: {
    axis: string;
    tag: string;
    overrideBookings: number;
    mismatchEvents: number;
    instabilityScore: number;
  }[];
};

function readApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return fallback;
}

function buildScopedQuery(params?: {
  windowHours?: number;
  updatedSince?: string;
  topLimit?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.windowHours != null) {
    sp.set("windowHours", String(params.windowHours));
  }
  if (params?.updatedSince?.trim()) {
    sp.set("updatedSince", params.updatedSince.trim());
  }
  if (params?.topLimit != null) {
    sp.set("topLimit", String(params.topLimit));
  }
  return sp.toString();
}

export async function fetchAdminAuthorityQuality(
  apiBase: string,
  token: string,
  params?: { windowHours?: number; updatedSince?: string; topLimit?: number },
): Promise<BookingAuthorityQualityPayload> {
  const qs = buildScopedQuery(params);
  const url = `${apiBase}/admin/authority/quality${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new Error(
      readApiErrorMessage(payload, `Authority quality failed (${response.status})`),
    );
  }
  return payload as BookingAuthorityQualityPayload;
}

export async function fetchAdminAuthorityDrift(
  apiBase: string,
  token: string,
  params?: { windowHours?: number; updatedSince?: string; topLimit?: number },
): Promise<BookingAuthorityDriftPayload> {
  const qs = buildScopedQuery(params);
  const url = `${apiBase}/admin/authority/drift${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new Error(
      readApiErrorMessage(payload, `Authority drift failed (${response.status})`),
    );
  }
  return payload as BookingAuthorityDriftPayload;
}
