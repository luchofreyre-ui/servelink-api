/** Matches `FoSupplyOpsCategory` in `fo.service.ts` without importing (avoids cycles). */
export type FoSupplyOpsCategoryLiteral =
  | "ready"
  | "blocked_configuration"
  | "inactive_or_restricted";

/** Shape required for queue derivation — implemented by `FoSupplyReadinessDiagnosticItem`. */
export type FoSupplyQueueDerivationInput = {
  opsCategory: FoSupplyOpsCategoryLiteral;
  supply: { ok: boolean; reasons: string[] };
  eligibility: { reasons: string[] };
  execution?: { ok: boolean; reasons: string[] };
};

/**
 * Fleet / queue segmentation derived only from diagnostic `opsCategory` + `supply.ok`.
 * No duplicate readiness rules.
 */
export type FoSupplyQueueState =
  | "READY_TO_ACTIVATE"
  | "BLOCKED_CONFIGURATION"
  | "ACTIVE_AND_READY"
  | "ACTIVE_BUT_BLOCKED";

export const FO_SUPPLY_QUEUE_STATES: readonly FoSupplyQueueState[] = [
  "READY_TO_ACTIVATE",
  "BLOCKED_CONFIGURATION",
  "ACTIVE_AND_READY",
  "ACTIVE_BUT_BLOCKED",
] as const;

export function isFoSupplyQueueState(v: string): v is FoSupplyQueueState {
  return (FO_SUPPLY_QUEUE_STATES as readonly string[]).includes(v);
}

/**
 * `inactive_or_restricted` + `supply.ok` is not sufficient for READY_TO_ACTIVATE:
 * safety hold / ban / delete still block activation even when supply config is fine.
 * Gate on eligibility reason codes already computed for the FO (no new readiness math).
 */
function isPausedReadyToActivate(row: FoSupplyQueueDerivationInput): boolean {
  if (!row.supply.ok || row.opsCategory !== "inactive_or_restricted") {
    return false;
  }
  if (row.execution && !row.execution.ok) {
    return false;
  }
  return row.eligibility.reasons.every((r) => r === "FO_NOT_ACTIVE");
}

export function deriveFoSupplyQueueState(
  row: FoSupplyQueueDerivationInput,
): FoSupplyQueueState {
  if (row.opsCategory === "ready") {
    return "ACTIVE_AND_READY";
  }
  if (row.opsCategory === "blocked_configuration") {
    return "ACTIVE_BUT_BLOCKED";
  }
  if (isPausedReadyToActivate(row)) {
    return "READY_TO_ACTIVATE";
  }
  if (!row.supply.ok) {
    return "BLOCKED_CONFIGURATION";
  }
  return "BLOCKED_CONFIGURATION";
}

export function mergeFoSupplyReasonCodes(row: FoSupplyQueueDerivationInput): string[] {
  const exec = row.execution?.reasons ?? [];
  return Array.from(
    new Set([...row.supply.reasons, ...row.eligibility.reasons, ...exec]),
  );
}
