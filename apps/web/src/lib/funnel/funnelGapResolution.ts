import { buildFunnelGapReport } from "./funnelGapReport";

export type ResolutionAction = "acknowledge" | "resolve" | "suppress";

const DISMISSED_SLUGS_KEY = "servelink.monetizationGapDismissedSlugs.v1";

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

export function resolveGap(problemSlug: string, action: ResolutionAction): void {
  console.log(`Monetization gap for ${problemSlug} has been ${action}`);
}

export function resolveAllGaps(action: ResolutionAction): void {
  const gaps = buildFunnelGapReport();
  const slugs = [...new Set(gaps.map((g) => g.problemSlug))];
  slugs.forEach((slug) => resolveGap(slug, action));
}
