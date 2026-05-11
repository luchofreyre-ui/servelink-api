import { BadRequestException } from "@nestjs/common";
import type { EstimateConfidenceBreakdown } from "../confidence/estimate-confidence-breakdown.types";
import type { EstimateEscalationGovernance } from "../escalation/estimate-escalation-governance.types";
import type { RecurringEconomicsGovernance } from "../recurring-economics/recurring-economics-governance.types";
import type { EstimateInput } from "../../modules/estimate/estimator.service";
import type { MaintenanceStateEvolutionResult } from "../maintenance-state/maintenance-state.types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/**
 * Parses quote-time BookingEstimateSnapshot.outputJson shape used when bookings are created.
 */
export function parseEstimateSnapshotOutputForMaintenanceReplay(
  outputJson: string | null | undefined,
): {
  estimateInput: EstimateInput;
  confidenceBreakdown: EstimateConfidenceBreakdown;
  escalationGovernance: EstimateEscalationGovernance;
  recurringEconomicsGovernance: RecurringEconomicsGovernance | undefined;
  estimatorVersion?: string;
  /** Snapshot may already include evolution blob — optional reconciliation vs replay. */
  persistedMaintenanceEvolution?: MaintenanceStateEvolutionResult;
} {
  if (!outputJson?.trim()) {
    throw new BadRequestException("MAINTENANCE_REPLAY_SNAPSHOT_MISSING");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(outputJson) as unknown;
  } catch {
    throw new BadRequestException("MAINTENANCE_REPLAY_SNAPSHOT_JSON_INVALID");
  }
  const root = asRecord(parsed);
  if (!root) {
    throw new BadRequestException("MAINTENANCE_REPLAY_SNAPSHOT_SHAPE_INVALID");
  }

  const rawIntake = root.rawNormalizedIntake ?? root.estimateInput;
  const intakeRec = asRecord(rawIntake);
  if (!intakeRec) {
    throw new BadRequestException("MAINTENANCE_REPLAY_INTAKE_MISSING");
  }
  const estimateInput = intakeRec as EstimateInput;

  const confidenceBreakdown = asRecord(root.confidenceBreakdown) as unknown as
    | EstimateConfidenceBreakdown
    | null;
  if (
    !confidenceBreakdown ||
    typeof confidenceBreakdown !== "object" ||
    !confidenceBreakdown.recurringTransitionConfidence
  ) {
    throw new BadRequestException("MAINTENANCE_REPLAY_CONFIDENCE_MISSING");
  }

  const escalationGovernance = asRecord(root.escalationGovernance) as unknown as
    | EstimateEscalationGovernance
    | null;
  if (
    !escalationGovernance ||
    typeof escalationGovernance.escalationLevel !== "string"
  ) {
    throw new BadRequestException("MAINTENANCE_REPLAY_ESCALATION_MISSING");
  }

  const recurringRaw = root.recurringEconomicsGovernance;
  const recurringEconomicsGovernance =
    recurringRaw && typeof recurringRaw === "object" && !Array.isArray(recurringRaw)
      ? (recurringRaw as RecurringEconomicsGovernance)
      : undefined;

  const meRaw = root.maintenanceStateEvolution;
  const persistedMaintenanceEvolution =
    meRaw && typeof meRaw === "object" && !Array.isArray(meRaw)
      ? (meRaw as MaintenanceStateEvolutionResult)
      : undefined;

  const estimatorVersion =
    typeof root.estimatorVersion === "string" ? root.estimatorVersion : undefined;

  return {
    estimateInput,
    confidenceBreakdown,
    escalationGovernance,
    recurringEconomicsGovernance,
    estimatorVersion,
    persistedMaintenanceEvolution,
  };
}
