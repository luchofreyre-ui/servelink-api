const PREFS_KEY = "servelink.funnelUserPreferences.v1";

export type FunnelUserPreferences = {
  lastEngagedProblemSlug?: string | null;
  lastEngagedSurface?: string | null;
  updatedAt?: string;
};

export function getFunnelUserPreferences(): FunnelUserPreferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as FunnelUserPreferences;
  } catch {
    return {};
  }
}

function writeFunnelUserPreferences(next: FunnelUserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/**
 * Persists lightweight cross-funnel prefs (e.g. last problem hub engagement) and mirrors to stage events.
 */
export function syncFunnelInteraction(stage: string, data: object): void {
  if (typeof window === "undefined") {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Syncing funnel interaction: ${stage}`, data);
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`Syncing funnel interaction: ${stage}`, data);
  }

  const d = data as {
    problemSlug?: string;
    surface?: string | null;
  };
  if (d.problemSlug === undefined && d.surface === undefined) return;

  const prev = getFunnelUserPreferences();
  writeFunnelUserPreferences({
    ...prev,
    lastEngagedProblemSlug:
      d.problemSlug !== undefined ? d.problemSlug : (prev.lastEngagedProblemSlug ?? null),
    lastEngagedSurface:
      d.surface !== undefined ? d.surface : (prev.lastEngagedSurface ?? null),
    updatedAt: new Date().toISOString(),
  });
}
