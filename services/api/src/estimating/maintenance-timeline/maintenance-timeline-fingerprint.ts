import { fnv1aHex } from "../maintenance-state/maintenance-state-evolution";
import { MAINTENANCE_STATE_SCHEMA_VERSION } from "../maintenance-state/maintenance-state.types";
import type { MaintenanceStateEvolutionInput } from "../maintenance-state/maintenance-state.types";

export const MAINTENANCE_TIMELINE_ENGINE_VERSION =
  "maintenance_timeline_checkpoint_v1" as const;

export const MAINTENANCE_TIMELINE_PAYLOAD_SCHEMA =
  "maintenance_timeline_payload_v1" as const;

/** Deterministic JSON stringify with sorted object keys (finite depth). */
export function stableJsonStringify(value: unknown): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number" || t === "boolean") return JSON.stringify(value);
  if (t === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((x) => stableJsonStringify(x)).join(",")}]`;
  }
  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${stableJsonStringify(obj[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(String(value));
}

/** Evolution-input fingerprint aligned with evolution stableSerialize semantics. */
export function fingerprintMaintenanceEvolutionInput(
  input: MaintenanceStateEvolutionInput,
): string {
  const ordered = {
    evaluationAnchor: input.evaluationAnchor,
    cadenceIntent: input.cadenceIntent,
    lastProfessionalCleanDeltaDays: input.lastProfessionalCleanDeltaDays,
    simulationElapsedDays: input.simulationElapsedDays ?? null,
    recurringOperationalStatus: input.recurringOperationalStatus ?? "unknown",
    missedVisit: Boolean(input.missedVisit),
    professionalCleanCompleted: Boolean(input.professionalCleanCompleted),
    consecutiveSuccessfulMaintenanceCount:
      input.consecutiveSuccessfulMaintenanceCount ?? 0,
    workloadVarianceRatios: [...(input.workloadVarianceRatios ?? [])].sort(
      (a, b) => a - b,
    ),
    escalation: input.escalation
      ? {
          escalationLevel: input.escalation.escalationLevel,
          recommendedActions: [...input.escalation.recommendedActions].sort(),
        }
      : null,
    recurringEconomics: input.recurringEconomics
      ? { ...input.recurringEconomics }
      : null,
    recurringTransition: input.recurringTransition
      ? {
          classification: input.recurringTransition.classification,
          uncertaintyDrivers: [
            ...input.recurringTransition.uncertaintyDrivers,
          ].sort(),
        }
      : null,
    scopeSparseIntake: Boolean(input.scopeSparseIntake),
    petAmbiguityDrivers: [...(input.petAmbiguityDrivers ?? [])].sort(),
  };
  return stableJsonStringify(ordered);
}

export function computeCheckpointInputFingerprint(params: {
  subjectType: string;
  subjectId: string;
  effectiveAtIso: string;
  sourceKind: string;
  evolutionInput: MaintenanceStateEvolutionInput;
}): string {
  const bundle = {
    schemaVersion: MAINTENANCE_STATE_SCHEMA_VERSION,
    engineVersion: MAINTENANCE_TIMELINE_ENGINE_VERSION,
    subjectType: params.subjectType,
    subjectId: params.subjectId,
    effectiveAt: params.effectiveAtIso,
    sourceKind: params.sourceKind,
    evolutionInputJson: fingerprintMaintenanceEvolutionInput(
      params.evolutionInput,
    ),
  };
  return fnv1aHex(stableJsonStringify(bundle));
}

export function computeCheckpointOutputFingerprint(
  compactPayload: Record<string, unknown>,
): string {
  return fnv1aHex(stableJsonStringify(compactPayload));
}
