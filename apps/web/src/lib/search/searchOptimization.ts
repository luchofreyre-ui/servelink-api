import { getFunnelUserPreferences } from "@/lib/analytics/funnelSync";

export type UserBehaviorData = {
  userSessionId: string;
  /** Time spent in this search session (seconds). */
  timeSpentSeconds: number;
  /** Product slugs the user clicked from search or related surfaces in-session. */
  previousClicks: string[];
  /** From cross-funnel sync (problem chips, product context, etc.). */
  lastEngagedProblemSlug?: string | null;
  lastEngagedSurface?: string | null;
};

/** Optional problem + surface slice for preference alignment in ranking. */
export type SearchRankingPreferenceContext = {
  problemSlug?: string;
  surface?: string | null;
};

const SESSION_STORAGE_KEY = "servelink.searchUserBehaviorSession.v1";
const MAX_PREVIOUS_CLICKS = 40;

type PersistedSession = {
  userSessionId: string;
  searchPageEnteredAt: number;
  accumulatedSeconds: number;
  previousClicks: string[];
};

function readSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

function writeSession(s: PersistedSession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function getOrCreateSearchSessionId(): string {
  let s = readSession();
  if (!s) {
    s = {
      userSessionId: `ss_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      searchPageEnteredAt: Date.now(),
      accumulatedSeconds: 0,
      previousClicks: [],
    };
    writeSession(s);
  }
  return s.userSessionId;
}

/** Call on the search results page to start or resume session timing. */
export function touchSearchSessionClock(): void {
  getOrCreateSearchSessionId();
}

/**
 * Adds dwell time since the last tick (call periodically while the tab is open).
 */
export function tickSearchSessionSeconds(deltaSeconds: number): void {
  const s = readSession();
  if (!s) return;
  s.accumulatedSeconds += Math.max(0, deltaSeconds);
  writeSession(s);
}

export function recordSearchProductClick(productSlug: string): void {
  getOrCreateSearchSessionId();
  const s = readSession();
  if (!s) return;
  const next = [...new Set([productSlug, ...s.previousClicks])].slice(0, MAX_PREVIOUS_CLICKS);
  s.previousClicks = next;
  writeSession(s);
}

export function getSearchUserBehavior(): UserBehaviorData {
  const prefs = getFunnelUserPreferences();
  const s = readSession();
  if (!s) {
    return {
      userSessionId: "anonymous",
      timeSpentSeconds: 0,
      previousClicks: [],
      lastEngagedProblemSlug: prefs.lastEngagedProblemSlug ?? null,
      lastEngagedSurface: prefs.lastEngagedSurface ?? null,
    };
  }
  const dwellSinceEnter = Math.max(0, (Date.now() - s.searchPageEnteredAt) / 1000);
  return {
    userSessionId: s.userSessionId,
    timeSpentSeconds: Math.floor(s.accumulatedSeconds + dwellSinceEnter),
    previousClicks: s.previousClicks,
    lastEngagedProblemSlug: prefs.lastEngagedProblemSlug ?? null,
    lastEngagedSurface: prefs.lastEngagedSurface ?? null,
  };
}

/**
 * Heuristic score used to break ties after editorial + click ordering.
 * Higher is better.
 */
export function calculateSearchRank(
  productSlug: string,
  userBehavior: UserBehaviorData,
  preferenceContext?: SearchRankingPreferenceContext,
): number {
  let rank = 0;
  if (userBehavior.previousClicks.includes(productSlug)) rank += 10;
  if (userBehavior.timeSpentSeconds > 120) rank += 5;
  if (
    preferenceContext?.problemSlug &&
    userBehavior.lastEngagedProblemSlug &&
    userBehavior.lastEngagedProblemSlug === preferenceContext.problemSlug
  ) {
    rank += 6;
  }
  if (
    preferenceContext?.surface &&
    userBehavior.lastEngagedSurface &&
    userBehavior.lastEngagedSurface === preferenceContext.surface
  ) {
    rank += 4;
  }
  return rank;
}
