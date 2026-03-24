export type FoAuthorityFeedbackAdminSummaryPayload = {
  kind: "fo_authority_feedback_admin_summary";
  generatedAt: string;
  windowUsed: { fromIso: string; toIso: string } | null;
  totalCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  undecidedCount: number;
  helpfulRate: number | null;
  recent: Array<{
    id: string;
    bookingId: string;
    helpful: boolean | null;
    selectedKnowledgePath: string | null;
    notes: string | null;
    createdAt: string;
  }>;
  topSelectedKnowledgePaths: Array<{ path: string; feedbackCount: number }>;
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

export async function fetchAdminFoAuthorityFeedbackSummary(
  apiBase: string,
  token: string,
  params?: { windowHours?: number; updatedSince?: string; topLimit?: number },
): Promise<FoAuthorityFeedbackAdminSummaryPayload> {
  const sp = new URLSearchParams();
  if (params?.windowHours != null) sp.set("windowHours", String(params.windowHours));
  if (params?.updatedSince?.trim()) sp.set("updatedSince", params.updatedSince.trim());
  if (params?.topLimit != null) sp.set("topLimit", String(params.topLimit));
  const qs = sp.toString();
  const url = `${apiBase}/api/v1/admin/authority/fo-feedback-summary${qs ? `?${qs}` : ""}`;
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
      readApiErrorMessage(payload, `FO feedback summary failed (${response.status})`),
    );
  }
  return payload as FoAuthorityFeedbackAdminSummaryPayload;
}
