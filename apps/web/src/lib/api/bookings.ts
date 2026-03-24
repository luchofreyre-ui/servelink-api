import { API_BASE_URL, apiFetch } from "@/lib/api";
import type { BookingScreenDeepCleanProgramApi } from "@/types/deepCleanProgram";
import type {
  DeepCleanAnalyticsQueryParamsApi,
  DeepCleanAnalyticsResponseApi,
  DeepCleanCalibrationReviewUpdatedResponseApi,
  UpdateDeepCleanCalibrationReviewRequestApi,
} from "@/types/deepCleanAnalytics";
import type { DeepCleanInsightsQueryParamsApi, DeepCleanInsightsResponseApi } from "@/types/deepCleanInsights";
import type {
  DeepCleanEstimatorImpactQueryParamsApi,
  DeepCleanEstimatorImpactResponseApi,
} from "@/types/deepCleanEstimatorImpact";
import type {
  DeepCleanEstimatorGovernanceDetailResponseApi,
  DeepCleanEstimatorGovernanceHistoryResponseApi,
  DeepCleanEstimatorRestoreDraftResponseApi,
} from "@/types/deepCleanEstimatorGovernance";
import type {
  DeepCleanEstimatorActiveResponseApi,
  DeepCleanEstimatorDraftResponseApi,
  DeepCleanEstimatorDraftUpdatedResponseApi,
  DeepCleanEstimatorPreviewResponseApi,
  DeepCleanEstimatorPublishedResponseApi,
  DeepCleanEstimatorConfigPayloadApi,
} from "@/types/deepCleanEstimatorConfig";

function appendDeepCleanAnalyticsQuery(
  qs: URLSearchParams,
  params: DeepCleanAnalyticsQueryParamsApi,
) {
  if (params.usableOnly === true) qs.set("usableOnly", "true");
  if (params.withOperatorNotesOnly === true) qs.set("withOperatorNotesOnly", "true");
  if (params.fullyCompletedOnly === true) qs.set("fullyCompletedOnly", "true");
  if (params.programType) qs.set("programType", params.programType);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.reviewStatus) qs.set("reviewStatus", params.reviewStatus);
  if (params.reasonTag) qs.set("reasonTag", params.reasonTag);
}

function appendDeepCleanInsightsQuery(
  qs: URLSearchParams,
  params: DeepCleanInsightsQueryParamsApi,
) {
  if (params.reviewedOnly === false) qs.set("reviewedOnly", "false");
  if (params.programType) qs.set("programType", params.programType);
  if (params.reasonTag) qs.set("reasonTag", params.reasonTag);
  if (params.feedbackBucket) qs.set("feedbackBucket", params.feedbackBucket);
  if (params.bookingNotesStartsWith) qs.set("bookingNotesStartsWith", params.bookingNotesStartsWith);
  if (params.reviewedAtFrom) qs.set("reviewedAtFrom", params.reviewedAtFrom);
  if (params.reviewedAtTo) qs.set("reviewedAtTo", params.reviewedAtTo);
}

function appendDeepCleanEstimatorImpactQuery(
  qs: URLSearchParams,
  params: DeepCleanEstimatorImpactQueryParamsApi,
) {
  if (params.reviewedOnly === false) qs.set("reviewedOnly", "false");
  if (params.usableOnly === false) qs.set("usableOnly", "false");
  if (params.programType) qs.set("programType", params.programType);
  if (params.version != null && params.version !== "") qs.set("version", params.version);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.includeTrend === true) qs.set("includeTrend", "true");
  if (params.trendWindowDays != null) qs.set("trendWindowDays", String(params.trendWindowDays));
  if (params.trendBucket) qs.set("trendBucket", params.trendBucket);
}

export type PublicBookingConfirmationResponse = {
  kind: "public_booking_confirmation";
  bookingId: string;
  estimateSnapshot: {
    estimatedPriceCents: number;
    estimatedDurationMinutes: number;
    confidence: number;
    serviceType: string | null;
  } | null;
  deepCleanProgram: BookingScreenDeepCleanProgramApi | null;
};

/**
 * Unauthenticated read for marketing confirmation cold loads (same persisted truth as screen.deepCleanProgram).
 */
export async function fetchPublicBookingConfirmation(
  bookingId: string,
): Promise<PublicBookingConfirmationResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/public/bookings/${encodeURIComponent(bookingId)}/confirmation`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Confirmation fetch failed (${res.status})`);
  }
  return res.json() as Promise<PublicBookingConfirmationResponse>;
}

export async function startDeepCleanVisit(
  bookingId: string,
  visitNumber: number,
): Promise<{ kind: string; execution: unknown }> {
  const res = await apiFetch(
    `/api/v1/bookings/${encodeURIComponent(bookingId)}/deep-clean/visits/${visitNumber}/start`,
    { method: "POST" },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Start visit failed (${res.status})`);
  }
  return res.json() as Promise<{ kind: string; execution: unknown }>;
}

export async function completeDeepCleanVisit(
  bookingId: string,
  visitNumber: number,
  payload: {
    actualDurationMinutes?: number | null;
    operatorNote?: string | null;
  },
): Promise<{ kind: string; execution: unknown }> {
  const res = await apiFetch(
    `/api/v1/bookings/${encodeURIComponent(bookingId)}/deep-clean/visits/${visitNumber}/complete`,
    {
      method: "POST",
      json: {
        actualDurationMinutes: payload.actualDurationMinutes ?? null,
        operatorNote: payload.operatorNote ?? null,
      },
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Complete visit failed (${res.status})`);
  }
  return res.json() as Promise<{ kind: string; execution: unknown }>;
}

export async function fetchAdminDeepCleanAnalytics(
  params?: DeepCleanAnalyticsQueryParamsApi,
): Promise<DeepCleanAnalyticsResponseApi> {
  const qs = new URLSearchParams();
  if (params) appendDeepCleanAnalyticsQuery(qs, params);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await apiFetch(`/api/v1/admin/deep-clean/analytics${suffix}`);
  const text = await res.text().catch(() => "");
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || text || `Deep clean analytics failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanAnalyticsResponseApi> | null;
  if (!obj || obj.kind !== "deep_clean_analytics" || !obj.summary || !Array.isArray(obj.rows)) {
    throw new Error("Unexpected deep clean analytics response shape.");
  }
  return obj as DeepCleanAnalyticsResponseApi;
}

export async function updateAdminDeepCleanCalibrationReview(
  bookingId: string,
  payload: UpdateDeepCleanCalibrationReviewRequestApi,
): Promise<DeepCleanCalibrationReviewUpdatedResponseApi> {
  const res = await apiFetch(
    `/api/v1/admin/deep-clean/analytics/${encodeURIComponent(bookingId)}/review`,
    {
      method: "POST",
      json: {
        reviewStatus: payload.reviewStatus,
        reviewReasonTags: payload.reviewReasonTags,
        reviewNote: payload.reviewNote ?? null,
      },
    },
  );
  const text = await res.text().catch(() => "");
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || text || `Review update failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanCalibrationReviewUpdatedResponseApi> | null;
  if (!obj || obj.kind !== "deep_clean_calibration_review_updated" || !obj.row) {
    throw new Error("Unexpected deep clean review response shape.");
  }
  return obj as DeepCleanCalibrationReviewUpdatedResponseApi;
}

export async function fetchAdminDeepCleanInsights(
  params?: DeepCleanInsightsQueryParamsApi,
): Promise<DeepCleanInsightsResponseApi> {
  const qs = new URLSearchParams();
  if (params) appendDeepCleanInsightsQuery(qs, params);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await apiFetch(`/api/v1/admin/deep-clean/insights${suffix}`);
  const text = await res.text().catch(() => "");
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || text || `Deep clean insights failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanInsightsResponseApi> | null;
  if (
    !obj ||
    obj.kind !== "deep_clean_insights" ||
    !obj.summary ||
    !Array.isArray(obj.reasonTagRows) ||
    !Array.isArray(obj.programTypeRows) ||
    !Array.isArray(obj.feedbackBuckets)
  ) {
    throw new Error("Unexpected deep clean insights response shape.");
  }
  return obj as DeepCleanInsightsResponseApi;
}

export async function fetchAdminDeepCleanEstimatorImpact(
  params?: DeepCleanEstimatorImpactQueryParamsApi,
): Promise<DeepCleanEstimatorImpactResponseApi> {
  const qs = new URLSearchParams();
  if (params) appendDeepCleanEstimatorImpactQuery(qs, params);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await apiFetch(`/api/v1/admin/deep-clean/estimator-impact${suffix}`);
  const text = await res.text().catch(() => "");
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || text || `Deep clean estimator impact failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanEstimatorImpactResponseApi> | null;
  if (
    !obj ||
    obj.kind !== "deep_clean_estimator_impact" ||
    !Array.isArray(obj.rows) ||
    !Array.isArray(obj.comparisons)
  ) {
    throw new Error("Unexpected deep clean estimator impact response shape.");
  }
  return obj as DeepCleanEstimatorImpactResponseApi;
}

async function parseJsonBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function fetchAdminDeepCleanEstimatorActiveConfig(): Promise<DeepCleanEstimatorActiveResponseApi> {
  const res = await apiFetch("/api/v1/admin/deep-clean/estimator-config/active");
  const body = await parseJsonBody(res);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || `Estimator active config failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanEstimatorActiveResponseApi> | null;
  if (!obj || obj.kind !== "deep_clean_estimator_config_active" || !obj.row) {
    throw new Error("Unexpected estimator active response.");
  }
  return obj as DeepCleanEstimatorActiveResponseApi;
}

export async function fetchAdminDeepCleanEstimatorDraftConfig(): Promise<DeepCleanEstimatorDraftResponseApi> {
  const res = await apiFetch("/api/v1/admin/deep-clean/estimator-config/draft");
  const body = await parseJsonBody(res);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || `Estimator draft config failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanEstimatorDraftResponseApi> | null;
  if (!obj || obj.kind !== "deep_clean_estimator_config_draft" || !obj.row) {
    throw new Error("Unexpected estimator draft response.");
  }
  return obj as DeepCleanEstimatorDraftResponseApi;
}

export async function updateAdminDeepCleanEstimatorDraftConfig(payload: {
  label?: string;
  config: DeepCleanEstimatorConfigPayloadApi;
}): Promise<DeepCleanEstimatorDraftUpdatedResponseApi> {
  const res = await apiFetch("/api/v1/admin/deep-clean/estimator-config/draft", {
    method: "POST",
    json: payload,
  });
  const body = await parseJsonBody(res);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || `Estimator draft update failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanEstimatorDraftUpdatedResponseApi> | null;
  if (!obj || obj.kind !== "deep_clean_estimator_config_draft_updated" || !obj.row) {
    throw new Error("Unexpected estimator draft update response.");
  }
  return obj as DeepCleanEstimatorDraftUpdatedResponseApi;
}

export async function publishAdminDeepCleanEstimatorDraft(): Promise<DeepCleanEstimatorPublishedResponseApi> {
  const res = await apiFetch("/api/v1/admin/deep-clean/estimator-config/publish", {
    method: "POST",
    json: {},
  });
  const body = await parseJsonBody(res);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || `Estimator publish failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanEstimatorPublishedResponseApi> | null;
  if (
    !obj ||
    obj.kind !== "deep_clean_estimator_config_published" ||
    !obj.published ||
    !obj.newDraft
  ) {
    throw new Error("Unexpected estimator publish response.");
  }
  return obj as DeepCleanEstimatorPublishedResponseApi;
}

export async function fetchAdminDeepCleanEstimatorConfigHistory(): Promise<DeepCleanEstimatorGovernanceHistoryResponseApi> {
  const res = await apiFetch("/api/v1/admin/deep-clean/estimator-config/history");
  const body = await parseJsonBody(res);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || `Estimator governance history failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanEstimatorGovernanceHistoryResponseApi> | null;
  if (!obj || obj.kind !== "deep_clean_estimator_config_history" || !Array.isArray(obj.rows)) {
    throw new Error("Unexpected estimator governance history response.");
  }
  return obj as DeepCleanEstimatorGovernanceHistoryResponseApi;
}

export async function fetchAdminDeepCleanEstimatorConfigDetail(
  id: string,
): Promise<DeepCleanEstimatorGovernanceDetailResponseApi> {
  const res = await apiFetch(
    `/api/v1/admin/deep-clean/estimator-config/${encodeURIComponent(id)}`,
  );
  const body = await parseJsonBody(res);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || `Estimator config detail failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanEstimatorGovernanceDetailResponseApi> | null;
  if (!obj || obj.kind !== "deep_clean_estimator_config_detail" || !obj.row) {
    throw new Error("Unexpected estimator config detail response.");
  }
  return obj as DeepCleanEstimatorGovernanceDetailResponseApi;
}

export async function restoreAdminDeepCleanEstimatorConfigToDraft(
  id: string,
): Promise<DeepCleanEstimatorRestoreDraftResponseApi> {
  const res = await apiFetch(
    `/api/v1/admin/deep-clean/estimator-config/${encodeURIComponent(id)}/restore-to-draft`,
    { method: "POST", json: {} },
  );
  const body = await parseJsonBody(res);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || `Restore to draft failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanEstimatorRestoreDraftResponseApi> | null;
  if (
    !obj ||
    obj.kind !== "deep_clean_estimator_config_restored_to_draft" ||
    !obj.draft ||
    typeof obj.restoredFromVersion !== "number"
  ) {
    throw new Error("Unexpected restore-to-draft response.");
  }
  return obj as DeepCleanEstimatorRestoreDraftResponseApi;
}

export async function previewAdminDeepCleanEstimatorConfig(estimateInput: Record<string, unknown>): Promise<DeepCleanEstimatorPreviewResponseApi> {
  const res = await apiFetch("/api/v1/admin/deep-clean/estimator-config/preview", {
    method: "POST",
    json: { estimateInput },
  });
  const body = await parseJsonBody(res);
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message ?? "")
        : "";
    throw new Error(msg || `Estimator preview failed (${res.status})`);
  }
  const obj = body as Partial<DeepCleanEstimatorPreviewResponseApi> | null;
  if (
    !obj ||
    obj.kind !== "deep_clean_estimator_preview" ||
    !obj.active ||
    !obj.draft ||
    typeof obj.deltaMinutes !== "number"
  ) {
    throw new Error("Unexpected estimator preview response.");
  }
  return obj as DeepCleanEstimatorPreviewResponseApi;
}
