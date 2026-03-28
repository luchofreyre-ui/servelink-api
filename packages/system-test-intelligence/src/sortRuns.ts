import type { SystemTestRunRowInput } from "./types";

/** Stable ascending order for cursor backfills and deterministic scans. */
export function compareRunIdAsc(a: { id: string }, b: { id: string }): number {
  return a.id.localeCompare(b.id);
}

export function sortRunsByIdAsc<T extends { id: string }>(runs: T[]): T[] {
  return [...runs].sort(compareRunIdAsc);
}

export function runRowToInput(r: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  totalCount: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  flakyCount: number;
  status: string;
  durationMs: number | null;
}): SystemTestRunRowInput {
  return {
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    totalCount: r.totalCount,
    passedCount: r.passedCount,
    failedCount: r.failedCount,
    skippedCount: r.skippedCount,
    flakyCount: r.flakyCount,
    status: r.status,
    durationMs: r.durationMs,
  };
}
