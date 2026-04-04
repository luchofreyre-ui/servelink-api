const FUNNEL_EVENTS_KEY = "servelink.funnelStageEvents.v1";
const MAX_EVENTS = 500;

export type FunnelStageEvent = {
  id: string;
  stage: string;
  at: string;
  detail: object;
};

function readEvents(): FunnelStageEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FUNNEL_EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FunnelStageEvent[];
  } catch {
    return [];
  }
}

function writeEvents(events: FunnelStageEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUNNEL_EVENTS_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch {
    /* ignore */
  }
}

export function trackFunnelStageAction(stage: string, actionDetails: object): void {
  if (typeof window === "undefined") {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Funnel Stage Action: ${stage}`, actionDetails);
    }
    return;
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const at = new Date().toISOString();
  const next: FunnelStageEvent = { id, stage, at, detail: actionDetails };
  writeEvents([next, ...readEvents()]);
  if (process.env.NODE_ENV !== "production") {
    console.log(`Funnel Stage Action: ${stage}`, actionDetails);
  }
}

export function listRecentFunnelStageEvents(limit = 100): FunnelStageEvent[] {
  return readEvents().slice(0, limit);
}

export function countFunnelStageInteractions(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of readEvents()) {
    counts[e.stage] = (counts[e.stage] ?? 0) + 1;
  }
  return counts;
}

export function clearFunnelStageEvents(): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof localStorage.removeItem === "function") {
      localStorage.removeItem(FUNNEL_EVENTS_KEY);
    }
  } catch {
    /* ignore */
  }
}
