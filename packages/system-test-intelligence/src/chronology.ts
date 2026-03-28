import type { ChronologyDiagnosticsV1, SystemTestCaseRowInput, SystemTestRunRowInput } from "./types";

function tryParseIso(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value.trim());
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function extractCaseTimestamp(raw: unknown): { iso: string | null; sourceField: string | null } {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { iso: null, sourceField: null };
  }
  const o = raw as Record<string, unknown>;
  const candidates = [
    "startTime",
    "startedAt",
    "timestamp",
    "wallTime",
    "startedTime",
    "beginTime",
  ] as const;
  for (const field of candidates) {
    const iso = tryParseIso(o[field]);
    if (iso) return { iso, sourceField: field };
  }
  return { iso: null, sourceField: null };
}

export function buildChronologyDiagnostics(
  run: SystemTestRunRowInput,
  cases: SystemTestCaseRowInput[],
): ChronologyDiagnosticsV1 {
  const warnings: string[] = [];
  const parsedCaseTimestamps = cases.map((c) => {
    const { iso, sourceField } = extractCaseTimestamp(c.rawCaseJson);
    if (
      c.rawCaseJson != null &&
      typeof c.rawCaseJson === "object" &&
      !Array.isArray(c.rawCaseJson) &&
      iso === null &&
      Object.keys(c.rawCaseJson as object).length > 0
    ) {
      const hasTimeLike = Object.keys(c.rawCaseJson as object).some((k) =>
        /time|stamp|start/i.test(k),
      );
      if (hasTimeLike) {
        warnings.push(
          `Case ${c.id}: rawCaseJson has time-like keys but no parseable timestamp.`,
        );
      }
    }
    return { caseId: c.id, iso, sourceField };
  });

  const byIso = new Map<string, string[]>();
  for (const row of parsedCaseTimestamps) {
    if (!row.iso) continue;
    const list = byIso.get(row.iso) ?? [];
    list.push(row.caseId);
    byIso.set(row.iso, list);
  }

  const duplicateTimestampGroups = [...byIso.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([iso, caseIds]) => ({ iso, caseIds: [...caseIds].sort() }));

  if (duplicateTimestampGroups.length > 0) {
    warnings.push(
      `${duplicateTimestampGroups.length} duplicate parsed case timestamp value(s); ordering may be ambiguous.`,
    );
  }

  return {
    version: "v1",
    runCreatedAtIso: run.createdAt,
    runUpdatedAtIso: run.updatedAt,
    caseOrderingBasis:
      "Prisma primary key ascending on SystemTestCaseResult.id (ingestion-stable)",
    parsedCaseTimestamps: parsedCaseTimestamps.sort((a, b) =>
      a.caseId.localeCompare(b.caseId),
    ),
    duplicateTimestampGroups,
    warnings,
  };
}
