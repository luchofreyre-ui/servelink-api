import type {
  SystemTestRunDetailMeta,
  SystemTestRunDetailResponse,
  SystemTestRunsListItem,
  SystemTestRunOrderingDiagnostics,
} from "@/types/systemTests";

function trimIso(s: string | null | undefined): string {
  return typeof s === "string" ? s.trim() : "";
}

/** Parse ISO-ish timestamps; returns null if invalid or missing. */
export function parseSystemTestRunTimeMs(iso: string | null | undefined): number | null {
  const t = trimIso(iso);
  if (!t) return null;
  const ms = Date.parse(t);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Sort key: primary = best available epoch (createdAt, else updatedAt), else 0.
 * Secondary = id for deterministic ties.
 */
export function systemTestRunEpochMs(
  input: { createdAt?: string | null; updatedAt?: string | null; id?: string | null },
): number {
  const c = parseSystemTestRunTimeMs(input.createdAt);
  if (c != null) return c;
  const u = parseSystemTestRunTimeMs(input.updatedAt);
  if (u != null) return u;
  return 0;
}

export function orderingDiagnosticsForListItem(
  item: Pick<SystemTestRunsListItem, "id" | "createdAt">,
): SystemTestRunOrderingDiagnostics {
  const raw = trimIso(item.createdAt);
  const ms = parseSystemTestRunTimeMs(raw);
  if (ms != null) {
    return { sortCreatedAt: raw, usedFallback: false, chronologyWarning: null };
  }
  return {
    sortCreatedAt: null,
    usedFallback: true,
    chronologyWarning: "createdAt missing or unparsable; ordering uses stable id tie-break.",
  };
}

export function orderingDiagnosticsForDetailMeta(
  run: Pick<SystemTestRunDetailMeta, "id" | "createdAt" | "updatedAt">,
): SystemTestRunOrderingDiagnostics {
  const created = trimIso(run.createdAt);
  const cMs = parseSystemTestRunTimeMs(created);
  if (cMs != null) {
    return { sortCreatedAt: created, usedFallback: false, chronologyWarning: null };
  }
  const updated = trimIso(run.updatedAt);
  const uMs = parseSystemTestRunTimeMs(updated);
  if (uMs != null) {
    return {
      sortCreatedAt: updated,
      usedFallback: true,
      chronologyWarning: "createdAt missing or unparsable; used updatedAt for ordering.",
    };
  }
  return {
    sortCreatedAt: null,
    usedFallback: true,
    chronologyWarning: "No valid createdAt/updatedAt; ordering uses stable id tie-break.",
  };
}

function compareIds(a: string, b: string): number {
  return a.localeCompare(b);
}

export type SortSystemTestRunsListResult = {
  sorted: SystemTestRunsListItem[];
  listChronologyNote: string | null;
  diagnosticsByRunId: Record<string, SystemTestRunOrderingDiagnostics>;
};

function summarizeDuplicateTimestamps<T>(items: T[], getValidMs: (item: T) => number | null): string | null {
  const buckets = new Map<number, number>();
  for (const it of items) {
    const ms = getValidMs(it);
    if (ms == null) continue;
    buckets.set(ms, (buckets.get(ms) ?? 0) + 1);
  }
  for (const [, n] of buckets) {
    if (n > 1) {
      return "Multiple runs share the same timestamp; newer/older order uses run id as a deterministic tie-break.";
    }
  }
  return null;
}

/** Newest-first for dashboard tables and “latest” selection. */
export function sortSystemTestRunsListNewestFirst(items: SystemTestRunsListItem[]): SortSystemTestRunsListResult {
  const diagnosticsByRunId: Record<string, SystemTestRunOrderingDiagnostics> = {};
  const notes: string[] = [];

  for (const it of items) {
    diagnosticsByRunId[it.id] = orderingDiagnosticsForListItem(it);
    const w = diagnosticsByRunId[it.id].chronologyWarning;
    if (w) notes.push(w);
  }

  const dupNote = summarizeDuplicateTimestamps(items, (i) => parseSystemTestRunTimeMs(i.createdAt));
  if (dupNote) notes.push(dupNote);

  const sorted = [...items].sort((a, b) => {
    const ea = systemTestRunEpochMs(a);
    const eb = systemTestRunEpochMs(b);
    if (eb !== ea) return eb - ea;
    return compareIds(a.id, b.id);
  });

  const uniq = [...new Set(notes)].sort((x, y) => x.localeCompare(y));
  return {
    sorted,
    listChronologyNote: uniq.length ? uniq.join(" ") : null,
    diagnosticsByRunId,
  };
}

/** Oldest-first for trend lines and chronological slices. */
export function sortSystemTestRunsListOldestFirst(items: SystemTestRunsListItem[]): SortSystemTestRunsListResult {
  const { sorted: newestFirst, listChronologyNote, diagnosticsByRunId } = sortSystemTestRunsListNewestFirst(items);
  return {
    sorted: [...newestFirst].reverse(),
    listChronologyNote,
    diagnosticsByRunId,
  };
}

export type SortSystemTestDetailResponsesResult = {
  sorted: SystemTestRunDetailResponse[];
  listChronologyNote: string | null;
};

/** Newest-first for prior-run windows fed into history analysis. */
export function sortSystemTestDetailResponsesNewestFirst(
  details: SystemTestRunDetailResponse[],
): SortSystemTestDetailResponsesResult {
  const notes: string[] = [];
  for (const d of details) {
    const w = orderingDiagnosticsForDetailMeta(d.run).chronologyWarning;
    if (w) notes.push(w);
  }

  const dupNote = summarizeDuplicateTimestamps(details, (d) =>
    parseSystemTestRunTimeMs(d.run.createdAt) ?? parseSystemTestRunTimeMs(d.run.updatedAt),
  );
  if (dupNote) notes.push(dupNote);

  const sorted = [...details].sort((a, b) => {
    const ea = systemTestRunEpochMs(a.run);
    const eb = systemTestRunEpochMs(b.run);
    if (eb !== ea) return eb - ea;
    return compareIds(a.run.id, b.run.id);
  });

  const uniq = [...new Set(notes)].sort((x, y) => x.localeCompare(y));
  return {
    sorted,
    listChronologyNote: uniq.length ? uniq.join(" ") : null,
  };
}
