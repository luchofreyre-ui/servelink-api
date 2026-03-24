import type { AuthorityAlertActionHints } from "@/lib/api/adminAuthorityAlerts";

/** Query keys shared by report/drift clients for alert deep-links. */
export const AUTHORITY_URL = {
  status: "authorityStatus",
  tag: "authorityTag",
  tagAxis: "authorityTagAxis",
  mismatchType: "authorityMismatchType",
  focusBookings: "focusBookings",
  /** Pass-through to API-style time scope */
  updatedSince: "updatedSince",
  windowHours: "windowHours",
} as const;

export type AuthorityReportSearchParams = {
  authorityStatus: string | null;
  authorityTag: string | null;
  authorityTagAxis: string | null;
  authorityMismatchType: string | null;
  focusBookingIds: string[];
  updatedSince: string | null;
  windowHours: string | null;
};

type SearchParamsLike = { get(name: string): string | null };

export function parseAuthorityAdminSearchParams(
  searchParams: SearchParamsLike,
): AuthorityReportSearchParams {
  const fb = searchParams.get(AUTHORITY_URL.focusBookings)?.trim() ?? "";
  const focusBookingIds = fb
    ? fb.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return {
    authorityStatus: searchParams.get(AUTHORITY_URL.status),
    authorityTag: searchParams.get(AUTHORITY_URL.tag),
    authorityTagAxis: searchParams.get(AUTHORITY_URL.tagAxis),
    authorityMismatchType: searchParams.get(AUTHORITY_URL.mismatchType),
    focusBookingIds,
    updatedSince: searchParams.get(AUTHORITY_URL.updatedSince),
    windowHours: searchParams.get(AUTHORITY_URL.windowHours),
  };
}

/**
 * Build a suggested admin path with filter query params from alert hints and the alert window.
 */
export function buildAuthorityAlertDestinationHref(
  suggestedPath: string,
  hints: AuthorityAlertActionHints | null | undefined,
  windowUsed: { fromIso: string; toIso: string },
): string {
  const path = suggestedPath.trim();
  if (!path.startsWith("/")) {
    return path;
  }
  const sp = new URLSearchParams();
  if (hints?.relevantStatus?.trim()) {
    sp.set(AUTHORITY_URL.status, hints.relevantStatus.trim());
  }
  if (hints?.relevantTag?.trim()) {
    sp.set(AUTHORITY_URL.tag, hints.relevantTag.trim());
  }
  if (hints?.relevantTagAxis?.trim()) {
    sp.set(AUTHORITY_URL.tagAxis, hints.relevantTagAxis.trim());
  }
  if (hints?.relevantMismatchType?.trim()) {
    sp.set(AUTHORITY_URL.mismatchType, hints.relevantMismatchType.trim());
  }
  const ids = hints?.affectedBookingIds?.filter(Boolean) ?? [];
  if (ids.length > 0) {
    sp.set(AUTHORITY_URL.focusBookings, ids.slice(0, 12).join(","));
  }
  if (windowUsed.fromIso?.trim()) {
    sp.set(AUTHORITY_URL.updatedSince, windowUsed.fromIso.trim());
  }
  const q = sp.toString();
  return q ? `${path}?${q}` : path;
}
