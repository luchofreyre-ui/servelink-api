export type WarehouseOperationalFreshnessLabel =
  | "NOT_REFRESHED"
  | "FRESH"
  | "STALE"
  | "FAILED"
  | "EMPTY_BUT_VALID";

export type WarehouseCronRunLite = {
  status: string;
  finishedAt: string | null;
  metadata: unknown;
};

/** Metadata keys persisted on successful warehouse refresh cron runs (ledger + dashboard classification). */
export const WAREHOUSE_REFRESH_COUNTER_METADATA_KEYS = [
  "snapshotsWritten",
  "aggregatesWritten",
  "operationalReplaySessionsWritten",
  "operationalReplayDiffsWritten",
  "operationalEntityNodesWritten",
  "operationalEntityEdgesWritten",
  "cohortSnapshotsWritten",
  "operationalExperimentSnapshotsWritten",
  "interventionSandboxesWritten",
  "interventionAssignmentsWritten",
  "validityCertificationsWritten",
] as const;

const FRESH_MS = 60 * 60 * 1000;

function parseIsoMs(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

function maxFiniteMs(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.max(a, b);
}

export function warehouseCronSuccessHasAllZeroCounters(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  const o = metadata as Record<string, unknown>;
  for (const key of WAREHOUSE_REFRESH_COUNTER_METADATA_KEYS) {
    const v = o[key];
    if (typeof v !== "number" || !Number.isFinite(v)) return false;
    if (v !== 0) return false;
  }
  return true;
}

export type WarehouseOperationalFreshness = {
  label: WarehouseOperationalFreshnessLabel;
  warehouseBatchRefreshedAt: string | null;
  latestCronStatus: string | null;
  lastCronSuccessFinishedAt: string | null;
  anchorRefreshedAt: string | null;
};

/** Canonical serialized freshness envelope for durable audit columns (stable key order). */
export function serializeWarehouseOperationalFreshness(
  f: WarehouseOperationalFreshness,
): string {
  return JSON.stringify({
    label: f.label,
    warehouseBatchRefreshedAt: f.warehouseBatchRefreshedAt,
    latestCronStatus: f.latestCronStatus,
    lastCronSuccessFinishedAt: f.lastCronSuccessFinishedAt,
    anchorRefreshedAt: f.anchorRefreshedAt,
  });
}

/**
 * Deterministic warehouse read-model freshness — uses latest cron ledger rows for this job plus primary warehouse batch timestamp.
 */
export function classifyWarehouseOperationalFreshness(args: {
  warehouseBatchRefreshedAt: string | null;
  latestJobRuns: WarehouseCronRunLite[];
  nowMs: number;
}): WarehouseOperationalFreshness {
  const runs = args.latestJobRuns;
  const latest = runs[0];
  const latestCronStatus = latest?.status ?? null;

  if (latest?.status === "failed") {
    const priorOk = runs.find((r) => r.status === "succeeded");
    return {
      label: "FAILED",
      warehouseBatchRefreshedAt: args.warehouseBatchRefreshedAt,
      latestCronStatus,
      lastCronSuccessFinishedAt: priorOk?.finishedAt ?? null,
      anchorRefreshedAt: null,
    };
  }

  const lastSuccess = runs.find((r) => r.status === "succeeded");
  const lastCronSuccessFinishedAt = lastSuccess?.finishedAt ?? null;

  if (lastSuccess && warehouseCronSuccessHasAllZeroCounters(lastSuccess.metadata)) {
    const anchorMsEmpty = maxFiniteMs(
      parseIsoMs(args.warehouseBatchRefreshedAt),
      parseIsoMs(lastCronSuccessFinishedAt),
    );
    return {
      label: "EMPTY_BUT_VALID",
      warehouseBatchRefreshedAt: args.warehouseBatchRefreshedAt,
      latestCronStatus,
      lastCronSuccessFinishedAt,
      anchorRefreshedAt:
        anchorMsEmpty != null ? new Date(anchorMsEmpty).toISOString() : null,
    };
  }

  const anchorMs = maxFiniteMs(
    parseIsoMs(args.warehouseBatchRefreshedAt),
    parseIsoMs(lastCronSuccessFinishedAt),
  );

  if (anchorMs == null) {
    return {
      label: "NOT_REFRESHED",
      warehouseBatchRefreshedAt: args.warehouseBatchRefreshedAt,
      latestCronStatus,
      lastCronSuccessFinishedAt,
      anchorRefreshedAt: null,
    };
  }

  const label: WarehouseOperationalFreshnessLabel =
    args.nowMs - anchorMs <= FRESH_MS ? "FRESH" : "STALE";

  return {
    label,
    warehouseBatchRefreshedAt: args.warehouseBatchRefreshedAt,
    latestCronStatus,
    lastCronSuccessFinishedAt,
    anchorRefreshedAt: new Date(anchorMs).toISOString(),
  };
}
