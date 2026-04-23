import {
  clampCrewSizeForService,
  type ServiceSegment,
} from "./crew-capacity-policy";

function approxSqftFromBand(band: string): number {
  const m: Record<string, number> = {
    "0_799": 600,
    "800_1199": 1000,
    "1200_1599": 1400,
    "1600_1999": 1800,
    "2000_2499": 2250,
    "2500_2999": 2750,
    "3000_3499": 3250,
    "3500_plus": 4000,
  };
  return m[band] ?? 1500;
}

export function parseServiceSegmentFromEstimateInputJson(
  inputJson: string,
): ServiceSegment {
  try {
    const inp = JSON.parse(inputJson) as Record<string, unknown>;
    const raw = inp.job_site_class;
    if (raw === "commercial") return "commercial";
    return "residential";
  } catch {
    return "residential";
  }
}

export type EstimateJobMatchFields = {
  squareFootage: number;
  estimatedLaborMinutes: number;
  recommendedTeamSize: number;
  serviceType: string;
  serviceSegment: ServiceSegment;
};

/**
 * Single parser for estimator snapshot → FO matching / public booking orchestration.
 * Prefers `adjustedLaborMinutes` from estimate output when present (workload truth).
 */
export function parseEstimateJobMatchFields(snapshot: {
  outputJson: string;
  inputJson: string;
}): EstimateJobMatchFields | null {
  try {
    const out = JSON.parse(snapshot.outputJson) as Record<string, unknown>;
    const inp = JSON.parse(snapshot.inputJson) as Record<string, unknown>;
    const sqftBand =
      typeof inp.sqft_band === "string" ? inp.sqft_band : "1200_1599";
    const squareFootage = approxSqftFromBand(sqftBand);

    const adjLaborRaw = out.adjustedLaborMinutes;
    const estimateMinutesRaw = out.estimateMinutes;
    const estimatedDurationMinutesRaw = out.estimatedDurationMinutes;
    const effectiveTeamSizeRaw = out.effectiveTeamSize;

    const estimatedLaborMinutes =
      typeof adjLaborRaw === "number" &&
      Number.isFinite(adjLaborRaw) &&
      adjLaborRaw > 0
        ? Math.max(1, Math.floor(adjLaborRaw))
        : typeof estimateMinutesRaw === "number" && Number.isFinite(estimateMinutesRaw)
          ? Math.max(1, Math.floor(estimateMinutesRaw))
          : typeof estimatedDurationMinutesRaw === "number" &&
              Number.isFinite(estimatedDurationMinutesRaw) &&
              typeof effectiveTeamSizeRaw === "number" &&
              Number.isFinite(effectiveTeamSizeRaw) &&
              effectiveTeamSizeRaw > 0
            ? Math.max(
                1,
                Math.floor(estimatedDurationMinutesRaw * effectiveTeamSizeRaw),
              )
            : 120;

    const recommendedTeamSizeRaw = out.recommendedTeamSize;
    const recommendedTeamSizeUncapped =
      typeof recommendedTeamSizeRaw === "number" &&
      Number.isFinite(recommendedTeamSizeRaw) &&
      recommendedTeamSizeRaw > 0
        ? Math.max(1, Math.floor(recommendedTeamSizeRaw))
        : 1;

    const stRaw = inp.service_type;
    const serviceType =
      stRaw === "maintenance" ||
      stRaw === "deep_clean" ||
      stRaw === "move_in" ||
      stRaw === "move_out"
        ? stRaw
        : "maintenance";

    const serviceSegment = parseServiceSegmentFromEstimateInputJson(
      snapshot.inputJson,
    );

    const recommendedTeamSize = clampCrewSizeForService(
      serviceType,
      serviceSegment,
      recommendedTeamSizeUncapped,
    );

    return {
      squareFootage,
      estimatedLaborMinutes,
      recommendedTeamSize,
      serviceType,
      serviceSegment,
    };
  } catch {
    return null;
  }
}
