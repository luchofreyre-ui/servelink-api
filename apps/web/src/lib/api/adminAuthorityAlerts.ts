export type AuthorityAlertSeverity = "low" | "medium" | "high";

export type AuthorityAlertActionHints = {
  affectedBookingIds?: string[];
  relevantStatus?: string;
  relevantTag?: string;
  relevantTagAxis?: string;
  relevantMismatchType?: string;
  suggestedAdminPath?: string;
};

export type AuthorityAlertItem = {
  alertType: string;
  severity: AuthorityAlertSeverity;
  evidenceSummary: string;
  windowUsed: { fromIso: string; toIso: string };
  details: Record<string, unknown>;
  actionHints?: AuthorityAlertActionHints | null;
};

export type BookingAuthorityAlertsPayload = {
  kind: "booking_authority_alerts";
  generatedAt: string;
  windowUsed: { fromIso: string; toIso: string };
  thresholdsUsed: Record<string, number>;
  alerts: AuthorityAlertItem[];
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

export async function fetchAdminAuthorityAlerts(
  apiBase: string,
  token: string,
  params?: {
    windowHours?: number;
    updatedSince?: string;
    minSampleSize?: number;
    overrideRateHighThreshold?: number;
    reviewRateLowThreshold?: number;
    mismatchTypeMinCount?: number;
    unstableTagScoreMin?: number;
    topLimit?: number;
  },
): Promise<BookingAuthorityAlertsPayload> {
  const sp = new URLSearchParams();
  if (params?.windowHours != null) sp.set("windowHours", String(params.windowHours));
  if (params?.updatedSince?.trim()) sp.set("updatedSince", params.updatedSince.trim());
  if (params?.minSampleSize != null) sp.set("minSampleSize", String(params.minSampleSize));
  if (params?.overrideRateHighThreshold != null) {
    sp.set("overrideRateHighThreshold", String(params.overrideRateHighThreshold));
  }
  if (params?.reviewRateLowThreshold != null) {
    sp.set("reviewRateLowThreshold", String(params.reviewRateLowThreshold));
  }
  if (params?.mismatchTypeMinCount != null) {
    sp.set("mismatchTypeMinCount", String(params.mismatchTypeMinCount));
  }
  if (params?.unstableTagScoreMin != null) {
    sp.set("unstableTagScoreMin", String(params.unstableTagScoreMin));
  }
  if (params?.topLimit != null) sp.set("topLimit", String(params.topLimit));
  const qs = sp.toString();
  const url = `${apiBase}/admin/authority/alerts${qs ? `?${qs}` : ""}`;
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
      readApiErrorMessage(payload, `Authority alerts failed (${response.status})`),
    );
  }
  return payload as BookingAuthorityAlertsPayload;
}
