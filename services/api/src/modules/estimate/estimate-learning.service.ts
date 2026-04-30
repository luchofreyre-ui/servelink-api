import { Injectable } from "@nestjs/common";
import type {
  EngineVarianceResult,
  EstimateAccuracyWinner,
  EstimateEngineId,
  EstimateLearningResult,
  EstimateVarianceCategory,
} from "./estimate-learning.types";

function finitePositiveMinutes(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.round(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function classifyVariance(variancePercent: number): EstimateVarianceCategory {
  if (variancePercent < -0.15) return "under";
  if (variancePercent > 0.15) return "over";
  return "on_target";
}

@Injectable()
export class EstimateLearningService {
  calculateEngineVariance(params: {
    engine: EstimateEngineId;
    predictedMinutes: number | null | undefined;
    actualMinutes: number;
  }): EngineVarianceResult | null {
    const predictedMinutes = finitePositiveMinutes(params.predictedMinutes);
    const actualMinutes = finitePositiveMinutes(params.actualMinutes);
    if (predictedMinutes == null || actualMinutes == null) return null;
    const varianceMinutes = actualMinutes - predictedMinutes;
    const variancePercent = varianceMinutes / predictedMinutes;
    return {
      engine: params.engine,
      predictedMinutes,
      actualMinutes,
      varianceMinutes,
      variancePercent,
      category: classifyVariance(variancePercent),
    };
  }

  calculateEstimateLearningResult(params: {
    bookingId: string;
    actualMinutes: number;
    legacyV1Minutes?: number | null;
    estimateV2ExpectedMinutes?: number | null;
    snapshotVersion?: string | null;
    serviceType?: string | null;
    riskLevel?: string | null;
    foId?: string | null;
  }): EstimateLearningResult {
    const actualMinutes = finitePositiveMinutes(params.actualMinutes);
    const legacyV1 = actualMinutes
      ? this.calculateEngineVariance({
          engine: "legacy_v1",
          predictedMinutes: params.legacyV1Minutes,
          actualMinutes,
        }) ?? undefined
      : undefined;
    const estimateV2 = actualMinutes
      ? this.calculateEngineVariance({
          engine: "estimate_v2",
          predictedMinutes: params.estimateV2ExpectedMinutes,
          actualMinutes,
        }) ?? undefined
      : undefined;
    const { winner, winnerReason } = this.resolveWinner({
      actualMinutes,
      legacyV1,
      estimateV2,
    });

    return {
      bookingId: params.bookingId,
      actualMinutes: actualMinutes ?? 0,
      ...(legacyV1 ? { legacyV1 } : {}),
      ...(estimateV2 ? { estimateV2 } : {}),
      winner,
      winnerReason,
      snapshotVersion: params.snapshotVersion ?? null,
      serviceType: params.serviceType ?? null,
      riskLevel: params.riskLevel ?? null,
      foId: params.foId ?? null,
      computedAt: new Date().toISOString(),
    };
  }

  extractLearningInputsFromSnapshot(snapshotOutputJson: string | null | undefined): {
    legacyV1Minutes?: number | null;
    estimateV2ExpectedMinutes?: number | null;
    snapshotVersion?: string | null;
    riskLevel?: string | null;
    serviceType?: string | null;
  } {
    if (!snapshotOutputJson?.trim()) return {};
    try {
      const parsed = JSON.parse(snapshotOutputJson) as Record<string, unknown>;
      const legacy = asRecord(parsed.legacy);
      const estimate = asRecord(parsed.estimate);
      const estimateV2 = asRecord(parsed.estimateV2);
      const rawNormalizedIntake = asRecord(parsed.rawNormalizedIntake);
      return {
        legacyV1Minutes:
          numberValue(legacy.durationMinutes) ??
          numberValue(estimate.durationMinutes) ??
          numberValue(parsed.estimatedDurationMinutes) ??
          null,
        estimateV2ExpectedMinutes: numberValue(estimateV2.expectedMinutes),
        snapshotVersion: stringValue(estimateV2.snapshotVersion),
        riskLevel: stringValue(estimateV2.riskLevel),
        serviceType:
          stringValue(rawNormalizedIntake.serviceType) ??
          stringValue(rawNormalizedIntake.service_type),
      };
    } catch {
      return {};
    }
  }

  private resolveWinner(args: {
    actualMinutes: number | null;
    legacyV1?: EngineVarianceResult;
    estimateV2?: EngineVarianceResult;
  }): { winner: EstimateAccuracyWinner; winnerReason: string } {
    if (!args.actualMinutes || (!args.legacyV1 && !args.estimateV2)) {
      return {
        winner: "insufficient_data",
        winnerReason: "Missing valid actual minutes or engine predictions.",
      };
    }
    if (args.legacyV1 && !args.estimateV2) {
      return {
        winner: "legacy_v1",
        winnerReason: "Only legacy v1 prediction was available.",
      };
    }
    if (!args.legacyV1 && args.estimateV2) {
      return {
        winner: "estimate_v2",
        winnerReason: "Only Estimate Engine v2 prediction was available.",
      };
    }
    const legacyError = Math.abs(args.legacyV1?.varianceMinutes ?? 0);
    const v2Error = Math.abs(args.estimateV2?.varianceMinutes ?? 0);
    if (Math.abs(legacyError - v2Error) <= 5) {
      return {
        winner: "tie",
        winnerReason: "Absolute error difference was within 5 minutes.",
      };
    }
    if (v2Error < legacyError) {
      return {
        winner: "estimate_v2",
        winnerReason: "Estimate Engine v2 had lower absolute minute error.",
      };
    }
    return {
      winner: "legacy_v1",
      winnerReason: "Legacy v1 had lower absolute minute error.",
    };
  }
}
