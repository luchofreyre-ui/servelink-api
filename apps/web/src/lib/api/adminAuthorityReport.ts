import type { BookingAuthorityReviewStatus } from "@/lib/api/adminBookingCommandCenter";

export type BookingAuthorityReportTagRow = {
  tag: string;
  bookingCount: number;
};

export type BookingAuthorityReportPayload = {
  kind: "booking_authority_report";
  generatedAt: string;
  totalRecords: number;
  countsByStatus: Record<BookingAuthorityReviewStatus, number>;
  topProblems: BookingAuthorityReportTagRow[];
  topSurfaces: BookingAuthorityReportTagRow[];
  topMethods: BookingAuthorityReportTagRow[];
  /** Present when the API scoped the report by `updatedAt` (optional). */
  scopeUpdatedAtMin?: string;
};

export type BookingAuthorityListItem = {
  bookingId: string;
  surfaces: string[];
  problems: string[];
  methods: string[];
  status: BookingAuthorityReviewStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingAuthorityResultsListPayload = {
  kind: "booking_authority_results";
  total: number;
  offset: number;
  limit: number;
  items: BookingAuthorityListItem[];
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

export async function fetchAdminAuthorityReport(
  apiBase: string,
  token: string,
  params?: {
    topLimit?: number;
    recentLimit?: number;
    windowHours?: number;
    updatedSince?: string;
  },
): Promise<BookingAuthorityReportPayload> {
  const sp = new URLSearchParams();
  if (params?.topLimit != null) {
    sp.set("topLimit", String(params.topLimit));
  }
  if (params?.recentLimit != null) {
    sp.set("recentLimit", String(params.recentLimit));
  }
  if (params?.windowHours != null) {
    sp.set("windowHours", String(params.windowHours));
  }
  if (params?.updatedSince?.trim()) {
    sp.set("updatedSince", params.updatedSince.trim());
  }
  const qs = sp.toString();
  const url = `${apiBase}/admin/authority/report${qs ? `?${qs}` : ""}`;
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
      readApiErrorMessage(payload, `Authority report failed (${response.status})`),
    );
  }
  return payload as BookingAuthorityReportPayload;
}

export async function fetchAdminAuthorityResultsList(
  apiBase: string,
  token: string,
  params?: {
    status?: BookingAuthorityReviewStatus;
    limit?: number;
    offset?: number;
  },
): Promise<BookingAuthorityResultsListPayload> {
  const sp = new URLSearchParams();
  if (params?.status) {
    sp.set("status", params.status);
  }
  if (params?.limit != null) {
    sp.set("limit", String(params.limit));
  }
  if (params?.offset != null) {
    sp.set("offset", String(params.offset));
  }
  const qs = sp.toString();
  const url = `${apiBase}/admin/authority/results${qs ? `?${qs}` : ""}`;
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
      readApiErrorMessage(
        payload,
        `Authority results list failed (${response.status})`,
      ),
    );
  }
  return payload as BookingAuthorityResultsListPayload;
}
