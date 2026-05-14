import { WAREHOUSE_REFRESH_COUNTER_METADATA_KEYS } from "./warehouse-operational-freshness";

export type OperationalAnalyticsReplayClassification =
  | "NO_PRIOR_SUCCESS"
  | "REPLAY_STABLE"
  | "REPLAY_CHANGED_WITH_SOURCE_COUNTER_DELTA"
  | "REPLAY_CHANGED_WITHOUT_SOURCE_COUNTER_DELTA"
  | "REPLAY_FAILED";

function canonicalCounterJson(obj: Record<string, number>): string {
  const keys = Object.keys(obj).sort();
  const sorted: Record<string, number> = {};
  for (const k of keys) sorted[k] = obj[k]!;
  return JSON.stringify(sorted);
}

function parseWarehouseRowsJson(raw: unknown): Record<string, number> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    out[k] = v;
  }
  return out;
}

function extractSourceCounters(
  rows: Record<string, number>,
): Record<string, number> | null {
  const out: Record<string, number> = {};
  for (const key of WAREHOUSE_REFRESH_COUNTER_METADATA_KEYS) {
    const v = rows[key];
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    out[key] = v;
  }
  return out;
}

/**
 * Deterministic replay audit classification for the newest pair of successful warehouse refresh runs.
 * Audit-only — never blocks refresh execution.
 */
export function classifyOperationalAnalyticsReplayForSuccessfulPair(args: {
  newerAfterFreshnessState: string | null | undefined;
  newerRows: unknown;
  olderAfterFreshnessState: string | null | undefined;
  olderRows: unknown;
}): OperationalAnalyticsReplayClassification {
  const {
    newerAfterFreshnessState,
    newerRows,
    olderAfterFreshnessState,
    olderRows,
  } = args;

  if (
    typeof newerAfterFreshnessState !== "string" ||
    typeof olderAfterFreshnessState !== "string"
  ) {
    return "REPLAY_FAILED";
  }

  const parsedNewer = parseWarehouseRowsJson(newerRows);
  const parsedOlder = parseWarehouseRowsJson(olderRows);
  if (!parsedNewer || !parsedOlder) return "REPLAY_FAILED";

  const sourceNewer = extractSourceCounters(parsedNewer);
  const sourceOlder = extractSourceCounters(parsedOlder);
  if (!sourceNewer || !sourceOlder) return "REPLAY_FAILED";

  const materialMatch =
    newerAfterFreshnessState === olderAfterFreshnessState &&
    canonicalCounterJson(parsedNewer) === canonicalCounterJson(parsedOlder);

  if (materialMatch) return "REPLAY_STABLE";

  const sourceDelta =
    canonicalCounterJson(sourceNewer) !== canonicalCounterJson(sourceOlder);

  return sourceDelta ?
      "REPLAY_CHANGED_WITH_SOURCE_COUNTER_DELTA"
    : "REPLAY_CHANGED_WITHOUT_SOURCE_COUNTER_DELTA";
}

export function classifyOperationalAnalyticsReplayFromSuccessfulRuns(
  successfulRunsNewestFirst: Array<{
    afterFreshnessState: string | null;
    rowsTouchedByWarehouseTable: unknown;
  }>,
): OperationalAnalyticsReplayClassification {
  const pair = successfulRunsNewestFirst.slice(0, 2);
  if (pair.length < 2) return "NO_PRIOR_SUCCESS";

  const [newer, older] = pair;
  return classifyOperationalAnalyticsReplayForSuccessfulPair({
    newerAfterFreshnessState: newer.afterFreshnessState,
    newerRows: newer.rowsTouchedByWarehouseTable,
    olderAfterFreshnessState: older.afterFreshnessState,
    olderRows: older.rowsTouchedByWarehouseTable,
  });
}
