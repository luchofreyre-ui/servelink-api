import type {
  EstimateV2Output,
  EstimateV2Reconciliation,
} from "./estimate-engine-v2.types";

export type EstimateV2SnapshotCarrier = {
  outputJson?: string | null;
};

export function extractEstimateV2FromSnapshot(
  snapshot: EstimateV2SnapshotCarrier | null | undefined,
): EstimateV2Output | null {
  const raw = snapshot?.outputJson;
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const candidate = parsed.estimateV2;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return null;
    }
    const output = candidate as EstimateV2Output;
    if (output.snapshotVersion !== "estimate_engine_v2_core_v1") return null;
    if (
      typeof output.expectedMinutes !== "number" ||
      typeof output.bufferMinutes !== "number" ||
      typeof output.pricedMinutes !== "number"
    ) {
      return null;
    }
    return output;
  } catch {
    return null;
  }
}

export function toFoVisibleEstimate(
  snapshot: EstimateV2SnapshotCarrier | null | undefined,
): { targetMinutes: number; riskFlags: string[] } | null {
  const estimateV2 = extractEstimateV2FromSnapshot(snapshot);
  if (!estimateV2) return null;
  return {
    targetMinutes: estimateV2.expectedMinutes,
    riskFlags: [...estimateV2.riskFlags],
  };
}

export function extractEstimateV2ReconciliationFromSnapshot(
  snapshot: EstimateV2SnapshotCarrier | null | undefined,
): EstimateV2Reconciliation | null {
  const raw = snapshot?.outputJson;
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const candidate = parsed.reconciliation;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return null;
    }
    const reconciliation = candidate as EstimateV2Reconciliation;
    if (
      reconciliation.authority?.pricingAuthority !== "legacy_v1" ||
      reconciliation.authority?.durationAuthority !== "legacy_v1" ||
      reconciliation.authority?.v2Mode !== "shadow"
    ) {
      return null;
    }
    if (
      typeof reconciliation.v1Minutes !== "number" ||
      typeof reconciliation.v2ExpectedMinutes !== "number" ||
      typeof reconciliation.expectedDeltaPercent !== "number"
    ) {
      return null;
    }
    return reconciliation;
  } catch {
    return null;
  }
}
