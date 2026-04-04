import { buildFunnelGapReport } from "./funnelGapReport";

export type ResolutionAction = "acknowledge" | "resolve" | "suppress";

const DISMISSED_SLUGS_KEY = "servelink.monetizationGapDismissedSlugs.v1";
const FEEDBACK_KEY = "servelink.monetizationGapFeedback.v1";

export type GapResolutionRecord = {
  action: ResolutionAction;
  note: string;
  at: string;
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
  if (typeof window === "undefined") return;
  localStorage.removeItem(DISMISSED_SLUGS_KEY);
}

export function saveGapResolutionFeedback(
  problemSlug: string,
  action: ResolutionAction,
  note: string,
  gapCode?: string,
): void {
  if (typeof window === "undefined") return;
  const all = loadAllGapResolutionFeedback();
  all[problemSlug] = {
    action,
    note: note.trim(),
    at: new Date().toISOString(),
    gapCode,
  };
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
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
  if (typeof window === "undefined") return;
  localStorage.removeItem(FEEDBACK_KEY);
}

/** Clears dismissed slugs + optional notes (browser only). */
export function clearAllMonetizationGapLocalState(): void {
  clearDismissedMonetizationGapsInAdmin();
  clearGapResolutionFeedback();
}

export function resolveGap(problemSlug: string, action: ResolutionAction): void {
  console.log(`Monetization gap for ${problemSlug} has been ${action}`);
}

export function resolveAllGaps(action: ResolutionAction): void {
  const gaps = buildFunnelGapReport();
  const slugs = [...new Set(gaps.map((g) => g.problemSlug))];
  slugs.forEach((slug) => resolveGap(slug, action));
}
