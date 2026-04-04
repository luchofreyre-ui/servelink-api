import { buildFunnelGapReport } from "./funnelGapReport";

export type ResolutionAction = "acknowledge" | "resolve" | "suppress";

const DISMISSED_SLUGS_KEY = "servelink.monetizationGapDismissedSlugs.v1";
const FEEDBACK_KEY = "servelink.monetizationGapFeedback.v1";
const AUDIT_KEY = "servelink.monetizationGapResolutionAudit.v1";
const MAX_AUDIT_ENTRIES = 250;

export type GapResolutionRecord = {
  action: ResolutionAction;
  note: string;
  at: string;
  gapCode?: string;
};

export type GapResolutionAuditEntry = {
  id: string;
  problemSlug: string;
  action: ResolutionAction;
  at: string;
  note?: string;
  gapCode?: string;
};

function readDismissedSlugsFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_SLUGS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function writeDismissedSlugsToStorage(slugs: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISSED_SLUGS_KEY, JSON.stringify([...slugs]));
}

function safeLocalStorageRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const ls = localStorage;
    if (typeof ls.removeItem === "function") {
      ls.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

/** Server-safe no-op; on the client, persists dismissed problem slugs for the ops panel. */
export function dismissMonetizationGapInAdmin(problemSlug: string): void {
  const next = readDismissedSlugsFromStorage();
  next.add(problemSlug);
  writeDismissedSlugsToStorage(next);
}

export function loadDismissedMonetizationGapSlugs(): Set<string> {
  return readDismissedSlugsFromStorage();
}

export function clearDismissedMonetizationGapsInAdmin(): void {
  safeLocalStorageRemove(DISMISSED_SLUGS_KEY);
}

function appendGapResolutionAudit(entry: Omit<GapResolutionAuditEntry, "id">): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const prev: GapResolutionAuditEntry[] = raw ? (JSON.parse(raw) as GapResolutionAuditEntry[]) : [];
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const next = [{ id, ...entry }, ...prev].slice(0, MAX_AUDIT_ENTRIES);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / parse errors */
  }
}

/** Newest first. Browser-only; empty on server. */
export function listGapResolutionAuditEntries(): GapResolutionAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GapResolutionAuditEntry[];
  } catch {
    return [];
  }
}

export function saveGapResolutionFeedback(
  problemSlug: string,
  action: ResolutionAction,
  note: string,
  gapCode?: string,
): void {
  if (typeof window === "undefined") return;
  const all = loadAllGapResolutionFeedback();
  const at = new Date().toISOString();
  all[problemSlug] = {
    action,
    note: note.trim(),
    at,
    gapCode,
  };
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
  resolveGap(problemSlug, action, {
    note: note.trim() || undefined,
    gapCode,
    at,
  });
}

export function loadAllGapResolutionFeedback(): Record<string, GapResolutionRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, GapResolutionRecord>;
  } catch {
    return {};
  }
}

export function loadGapResolutionFeedback(problemSlug: string): GapResolutionRecord | null {
  return loadAllGapResolutionFeedback()[problemSlug] ?? null;
}

export function clearGapResolutionFeedback(): void {
  safeLocalStorageRemove(FEEDBACK_KEY);
}

/** Clears dismissed slugs + optional notes (browser only). */
export function clearAllMonetizationGapLocalState(): void {
  clearDismissedMonetizationGapsInAdmin();
  clearGapResolutionFeedback();
}

export function clearGapResolutionAudit(): void {
  safeLocalStorageRemove(AUDIT_KEY);
}

export type ResolveGapMeta = {
  note?: string;
  gapCode?: string;
  /** When omitted, a new timestamp is used (bulk / programmatic resolves). */
  at?: string;
};

export function resolveGap(
  problemSlug: string,
  action: ResolutionAction,
  meta?: ResolveGapMeta,
): void {
  appendGapResolutionAudit({
    problemSlug,
    action,
    at: meta?.at ?? new Date().toISOString(),
    note: meta?.note,
    gapCode: meta?.gapCode,
  });
  console.log(`Monetization gap for ${problemSlug} has been ${action}`);
}

export function resolveAllGaps(action: ResolutionAction): void {
  const gaps = buildFunnelGapReport();
  const slugs = [...new Set(gaps.map((g) => g.problemSlug))];
  slugs.forEach((slug) => resolveGap(slug, action));
}
