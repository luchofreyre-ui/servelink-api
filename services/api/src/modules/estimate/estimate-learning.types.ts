export type EstimateEngineId = "legacy_v1" | "estimate_v2";

export type EstimateAccuracyWinner =
  | "legacy_v1"
  | "estimate_v2"
  | "tie"
  | "insufficient_data";

export type EstimateVarianceCategory = "under" | "on_target" | "over";

export interface EngineVarianceResult {
  engine: EstimateEngineId;
  predictedMinutes: number;
  actualMinutes: number;
  varianceMinutes: number;
  variancePercent: number;
  category: EstimateVarianceCategory;
}

export interface EstimateLearningResult {
  bookingId: string;
  actualMinutes: number;
  legacyV1?: EngineVarianceResult;
  estimateV2?: EngineVarianceResult;
  winner: EstimateAccuracyWinner;
  winnerReason: string;
  snapshotVersion?: string | null;
  serviceType?: string | null;
  riskLevel?: string | null;
  foId?: string | null;
  computedAt: string;
}
