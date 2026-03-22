export type CustomerDashboardViewModel = {
  counts: Record<string, unknown>;
  queue: { rows: unknown[] };
  raw: unknown;
};

export function buildCustomerDashboardViewModel(
  summary: unknown,
  _opts?: { emptyQueueMessage?: string; emptyMessage?: string },
): CustomerDashboardViewModel {
  const s = summary && typeof summary === "object" ? (summary as Record<string, unknown>) : {};
  const queue = s.queue && typeof s.queue === "object" ? (s.queue as { rows?: unknown[] }) : {};
  return {
    counts: (s.counts as Record<string, unknown>) ?? {},
    queue: { rows: Array.isArray(queue.rows) ? queue.rows : [] },
    raw: summary,
  };
}
