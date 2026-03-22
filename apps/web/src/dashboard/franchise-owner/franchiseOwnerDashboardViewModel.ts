export type FranchiseOwnerDashboardViewModel = {
  counts: Record<string, unknown>;
  queue: { rows: unknown[] };
  raw: unknown;
};

export function buildFranchiseOwnerDashboardViewModel(
  summary: unknown,
  _opts?: { emptyQueueMessage?: string },
): FranchiseOwnerDashboardViewModel {
  const s = summary && typeof summary === "object" ? (summary as Record<string, unknown>) : {};
  const queue = s.queue && typeof s.queue === "object" ? (s.queue as { rows?: unknown[] }) : {};
  return {
    counts: (s.counts as Record<string, unknown>) ?? {},
    queue: { rows: Array.isArray(queue.rows) ? queue.rows : [] },
    raw: summary,
  };
}
