import type { EstimateV2Output } from "./estimate-engine-v2.types";

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
