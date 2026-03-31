import { apiFetch } from "@/lib/api";
import { apiGet } from "@/lib/api/client";
import type { CanonicalPageSnapshot } from "@/lib/encyclopedia/canonicalTypes";

const BASE = "/api/v1/admin/encyclopedia/review";

export type ReviewedCandidateApiInput = {
  slug: string;
  title: string;
  canonicalSnapshot: CanonicalPageSnapshot;
  sourceName?: string;
};

export type ApiEncyclopediaReviewRecord = {
  slug: string;
  title: string;
  reviewStatus: string;
  publishStatus: string;
  source?: "api_manual" | "pipeline_import" | "reviewed_candidates";
  sourceDetail?: string;
  importedAt?: string;
  promotionErrors?: string[];
};

export type ApiMigrationSummary = {
  total: number;
  imported: number;
  manual: number;
  live: number;
  approvedNotLive: number;
  pending: number;
  failed: number;
};

export type ApiEncyclopediaReviewOpsSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  live: number;
  failed: number;
};

export type ApiEncyclopediaPromotionRunResult = {
  attempted: number;
  promoted: number;
  failed: number;
  promotedSlugs: string[];
  failures: { slug: string; errors: string[] }[];
  rejectionCounts: Record<string, number>;
};

export type ApiValidationInsights = {
  totalFailures: number;
  topErrors: { error: string; count: number }[];
  allErrors: { error: string; count: number }[];
  slugFailures: Record<string, string[]>;
};

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = JSON.parse(text) as T & { message?: string };
  if (!response.ok) {
    const msg =
      typeof (payload as { message?: unknown }).message === "string"
        ? String((payload as { message: string }).message)
        : `Request failed: ${response.status}`;
    throw new Error(msg);
  }
  return payload as T;
}

export async function fetchReviewList(): Promise<ApiEncyclopediaReviewRecord[]> {
  return apiGet<ApiEncyclopediaReviewRecord[]>(`${BASE}/list`);
}

export async function fetchMigrationSummary(): Promise<ApiMigrationSummary> {
  return apiGet<ApiMigrationSummary>(`${BASE}/migration-summary`);
}

export async function fetchReviewOps(): Promise<ApiEncyclopediaReviewOpsSummary> {
  return apiGet<ApiEncyclopediaReviewOpsSummary>(`${BASE}/ops`);
}

export async function approveReview(slug: string): Promise<{ success: boolean }> {
  const res = await apiFetch(`${BASE}/approve`, {
    method: "POST",
    json: { slug },
  });
  return parseJson<{ success: boolean }>(res);
}

export async function rejectReview(slug: string): Promise<{ success: boolean }> {
  const res = await apiFetch(`${BASE}/reject`, {
    method: "POST",
    json: { slug },
  });
  return parseJson<{ success: boolean }>(res);
}

export async function promoteApproved(): Promise<ApiEncyclopediaPromotionRunResult> {
  const res = await apiFetch(`${BASE}/promote`, {
    method: "POST",
  });
  return parseJson<ApiEncyclopediaPromotionRunResult>(res);
}

export async function retryFailed(): Promise<ApiEncyclopediaPromotionRunResult> {
  const res = await apiFetch(`${BASE}/retry`, {
    method: "POST",
  });
  return parseJson<ApiEncyclopediaPromotionRunResult>(res);
}

export async function fetchValidationInsights(): Promise<ApiValidationInsights> {
  return apiGet<ApiValidationInsights>(`${BASE}/insights`);
}

export type ApiGenerationFeedback = {
  criticalFailures: Array<{ error: string; count: number }>;
  guidance: string[];
};

export type ApiImportReviewResult = {
  importPath: string;
  attempted: number;
  created: number;
  skipped: number;
  total: number;
};

export async function fetchGenerationFeedback(): Promise<ApiGenerationFeedback> {
  return apiGet<ApiGenerationFeedback>(`${BASE}/generation-feedback`);
}

export async function importReviewRecords(): Promise<ApiImportReviewResult> {
  const response = await apiFetch(`${BASE}/import`, {
    method: "POST",
  });
  return parseJson<ApiImportReviewResult>(response);
}

export async function intakeGeneratedReviewRecord(
  snapshot: CanonicalPageSnapshot,
): Promise<ApiEncyclopediaReviewRecord> {
  const response = await apiFetch(`${BASE}/intake`, {
    method: "POST",
    json: { snapshot },
  });
  return parseJson<ApiEncyclopediaReviewRecord>(response);
}

export type ApiIntakeBatchResult = {
  attempted: number;
  upserted: number;
  slugs: string[];
};

export async function intakeGeneratedReviewRecords(
  snapshots: CanonicalPageSnapshot[],
): Promise<ApiIntakeBatchResult> {
  const response = await apiFetch(`${BASE}/intake-batch`, {
    method: "POST",
    json: { snapshots },
  });
  return parseJson<ApiIntakeBatchResult>(response);
}

export type ApiReviewedCandidatesIntakeResult = {
  attempted: number;
  created: number;
  updated: number;
  total: number;
  slugs: string[];
};

export async function intakeReviewedCandidates(
  candidates: ReviewedCandidateApiInput[],
): Promise<ApiReviewedCandidatesIntakeResult> {
  const response = await apiFetch(`${BASE}/reviewed-candidates`, {
    method: "POST",
    json: { candidates },
  });
  return parseJson<ApiReviewedCandidatesIntakeResult>(response);
}
