import type { DeepCleanEstimatorVersionHistoryRowApi } from "@/types/deepCleanEstimatorGovernance";

export function getArchivedVersions(rows: DeepCleanEstimatorVersionHistoryRowApi[]) {
  return rows.filter((r) => r.status === "archived");
}

export function getActiveVersion(rows: DeepCleanEstimatorVersionHistoryRowApi[]) {
  return rows.find((r) => r.status === "active") ?? null;
}

export function getDraftVersion(rows: DeepCleanEstimatorVersionHistoryRowApi[]) {
  return rows.find((r) => r.status === "draft") ?? null;
}

/** Among active + archived, highest version with publishedAt set (fallback: highest version). */
export function getLatestPublishedVersion(rows: DeepCleanEstimatorVersionHistoryRowApi[]) {
  const published = rows.filter((r) => r.status === "active" || r.status === "archived");
  if (published.length === 0) return null;
  return published.reduce((a, b) => (b.version > a.version ? b : a));
}

/**
 * Rollback-ready: active or archived, not the current draft row.
 */
export function getRollbackReadyCandidates(
  rows: DeepCleanEstimatorVersionHistoryRowApi[],
): DeepCleanEstimatorVersionHistoryRowApi[] {
  const draft = getDraftVersion(rows);
  return rows.filter(
    (r) =>
      (r.status === "archived" || r.status === "active") &&
      (!draft || r.id !== draft.id),
  );
}
