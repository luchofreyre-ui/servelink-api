import { apiFetch } from "../api";
import { readApiJson } from "../api-response";

const FETCH_INIT = {
  cache: "no-store" as const,
  next: { revalidate: 0 },
};

async function readJson<T>(path: string): Promise<T> {
  return readApiJson<T>(await apiFetch(path, FETCH_INIT));
}

export type RecurringOpsSummaryItem = {
  pendingGenerationCount: number;
  processingCount: number;
  failedRetryableCount: number;
  exhaustedCount: number;
  reconciliationDriftCount: number;
  canceledPlanWithBookedNextCount: number;
};

export type RecurringOpsSummaryResponse = {
  ok: true;
  item: RecurringOpsSummaryItem;
};

export type RecurringExhaustedRow = {
  occurrenceId: string;
  planId: string;
  customerId: string;
  customerEmail: string | null;
  processingAttempts: number;
  status: string;
  reconciliationState: string | null;
  bookingId: string | null;
  bookingFingerprint: string | null;
  generationError: string | null;
  updatedAt: string;
};

export type RecurringOpsExhaustedResponse = {
  ok: true;
  items: RecurringExhaustedRow[];
};

export async function getRecurringOpsSummary() {
  return readJson<RecurringOpsSummaryResponse>("/recurring/ops/summary");
}

export async function getRecurringOpsExhausted(limit = 50) {
  const q = new URLSearchParams({ limit: String(limit) });
  return readJson<RecurringOpsExhaustedResponse>(
    `/recurring/ops/exhausted?${q.toString()}`,
  );
}
