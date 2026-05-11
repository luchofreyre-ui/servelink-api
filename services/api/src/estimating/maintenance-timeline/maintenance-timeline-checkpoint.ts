import type { MaintenanceStateEvolutionResult } from "../maintenance-state/maintenance-state.types";
import {
  computeCheckpointOutputFingerprint,
  MAINTENANCE_TIMELINE_PAYLOAD_SCHEMA,
} from "./maintenance-timeline-fingerprint";

export function compactMaintenanceEvolutionForCheckpointPayload(
  evolution: MaintenanceStateEvolutionResult,
): Record<string, unknown> {
  return {
    payloadSchema: MAINTENANCE_TIMELINE_PAYLOAD_SCHEMA,
    currentState: evolution.currentState,
    projectedState: evolution.projectedState,
    projectedRiskLevel: evolution.projectedRiskLevel,
    resetReviewPressure: evolution.resetReviewPressure,
    maintenanceWarnings: evolution.maintenanceWarnings,
    recommendedActions: evolution.recommendedActions,
    replayMetadata: evolution.replayMetadata,
    adminShadowSummary: evolution.adminShadowSummary,
    transitionSummary: evolution.transitionHistory.map((t) => ({
      transitionType: t.transitionType,
      transitionReasons: t.transitionReasons,
      degradationDelta: t.degradationDelta,
      retentionDelta: t.retentionDelta,
      resultingClassification: t.resultingState.stateClassification,
      resultingScore: t.resultingState.maintenanceScore,
    })),
  };
}

export function computeOutputFingerprintFromEvolution(
  evolution: MaintenanceStateEvolutionResult,
): string {
  return computeCheckpointOutputFingerprint(
    compactMaintenanceEvolutionForCheckpointPayload(evolution),
  );
}
