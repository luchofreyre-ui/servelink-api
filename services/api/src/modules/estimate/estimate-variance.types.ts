import type { EstimateRiskLevel } from "./estimate-engine-v2.types";

export interface EstimateVarianceInput {
  bookingId: string;
  expectedMinutes: number;
  actualMinutes: number;
  snapshotVersion: string;
  foId?: string | null;
  serviceType?: string | null;
  riskLevel?: EstimateRiskLevel;
}

export interface EstimateVarianceResult {
  bookingId: string;
  expectedMinutes: number;
  actualMinutes: number;
  varianceMinutes: number;
  variancePercent: number;
  varianceCategory: "under" | "on_target" | "over";
}

export function calculateEstimateVariance(
  input: EstimateVarianceInput,
): EstimateVarianceResult {
  const expectedMinutes = Math.max(0, Math.round(input.expectedMinutes));
  const actualMinutes = Math.max(0, Math.round(input.actualMinutes));
  const varianceMinutes = actualMinutes - expectedMinutes;
  const variancePercent =
    expectedMinutes > 0 ? varianceMinutes / expectedMinutes : 0;
  const varianceCategory =
    variancePercent < -0.15
      ? "under"
      : variancePercent > 0.15
        ? "over"
        : "on_target";

  return {
    bookingId: input.bookingId,
    expectedMinutes,
    actualMinutes,
    varianceMinutes,
    variancePercent,
    varianceCategory,
  };
}
