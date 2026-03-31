export type SystemTestFamilyLifecycleState =
  | "new"
  | "recurring"
  | "resurfaced"
  | "dormant"
  | "resolved";

export type SystemTestFamilyLifecycleDto = {
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  seenInRunCount: number;
  recentRunCountConsidered: number;
  seenInLatestRun: boolean;
  seenInPreviousRun: boolean;
  consecutiveRunCount: number;
  runsSinceLastSeen: number | null;
  lifecycleState: SystemTestFamilyLifecycleState;
};

export type LifecycleRunPoint = {
  runId: string;
  startedAt: Date | string | null;
  hasFamily: boolean;
};

function toTimeMs(value: Date | string | null | undefined): number {
  if (value == null) return 0;
  if (value instanceof Date) return value.getTime();
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const t = new Date(value);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

/** Newest → oldest by startedAt, then runId. */
export function sortLifecycleRunPoints(points: LifecycleRunPoint[]): LifecycleRunPoint[] {
  return [...points].sort((a, b) => {
    const dt = toTimeMs(b.startedAt) - toTimeMs(a.startedAt);
    if (dt !== 0) return dt;
    return a.runId.localeCompare(b.runId);
  });
}

export function buildSystemTestFamilyLifecycle(
  rawPoints: LifecycleRunPoint[],
): SystemTestFamilyLifecycleDto {
  const points = sortLifecycleRunPoints(rawPoints);
  const recentRunCountConsidered = points.length;
  const seenInLatestRun = points[0]?.hasFamily ?? false;
  const seenInPreviousRun = points[1]?.hasFamily ?? false;

  let seenInRunCount = 0;
  let firstSeenAt: string | null = null;
  let lastSeenAt: string | null = null;
  for (const p of points) {
    if (!p.hasFamily) continue;
    seenInRunCount += 1;
    const iso = toIso(p.startedAt);
    if (iso) {
      if (firstSeenAt == null || iso < firstSeenAt) firstSeenAt = iso;
      if (lastSeenAt == null || iso > lastSeenAt) lastSeenAt = iso;
    }
  }

  let consecutiveRunCount = 0;
  for (const p of points) {
    if (p.hasFamily) consecutiveRunCount += 1;
    else break;
  }

  let runsSinceLastSeen: number | null = null;
  if (seenInRunCount === 0) {
    runsSinceLastSeen = null;
  } else if (seenInLatestRun) {
    runsSinceLastSeen = 0;
  } else {
    for (let i = 0; i < points.length; i += 1) {
      if (points[i].hasFamily) {
        runsSinceLastSeen = i;
        break;
      }
    }
  }

  let lifecycleState: SystemTestFamilyLifecycleState;
  if (seenInRunCount === 0) {
    lifecycleState = "resolved";
  } else if (seenInLatestRun) {
    if (seenInRunCount === 1) {
      lifecycleState = "new";
    } else if (seenInPreviousRun || consecutiveRunCount >= 2) {
      lifecycleState = "recurring";
    } else {
      lifecycleState = "resurfaced";
    }
  } else if (runsSinceLastSeen != null && runsSinceLastSeen <= 2) {
    lifecycleState = "dormant";
  } else {
    lifecycleState = "resolved";
  }

  return {
    firstSeenAt,
    lastSeenAt,
    seenInRunCount,
    recentRunCountConsidered,
    seenInLatestRun,
    seenInPreviousRun,
    consecutiveRunCount,
    runsSinceLastSeen,
    lifecycleState,
  };
}

export function systemTestFamilyLifecycleRank(
  lifecycle: SystemTestFamilyLifecycleDto | null | undefined,
): number {
  if (!lifecycle) return 0;
  switch (lifecycle.lifecycleState) {
    case "resurfaced":
      return 5;
    case "new":
      return 4;
    case "recurring":
      return 3;
    case "dormant":
      return 2;
    case "resolved":
      return 1;
    default:
      return 0;
  }
}

export function isActiveLifecycleState(state: SystemTestFamilyLifecycleState): boolean {
  return state === "new" || state === "recurring" || state === "resurfaced";
}

export function compareSystemTestFamilyLifecycleRank(
  a: SystemTestFamilyLifecycleDto,
  b: SystemTestFamilyLifecycleDto,
): number {
  const cmpRank = systemTestFamilyLifecycleRank(b) - systemTestFamilyLifecycleRank(a);
  if (cmpRank !== 0) return cmpRank;
  if (a.seenInRunCount !== b.seenInRunCount) return b.seenInRunCount - a.seenInRunCount;
  const ta = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
  const tb = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
  if (ta !== tb) return tb - ta;
  return b.consecutiveRunCount - a.consecutiveRunCount;
}
