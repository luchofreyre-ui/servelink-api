import type { ResolvedFranchiseOwnerCrewRange } from "./franchise-owner-crew-range";
import {
  getServiceMaxCrewSize,
  type ServiceSegment,
} from "./crew-capacity-policy";

/** Minimum wall-clock slot / rank duration (prevents zero-length scheduling artifacts). */
export const MIN_DURATION_MINUTES = 60;

/** Beyond this, candidates are not rejected — ranking applies a soft penalty. */
export const SOFT_LONG_DURATION_THRESHOLD_MINUTES = 480;

export type AssignedCrewInput = {
  serviceType: string;
  serviceSegment: ServiceSegment;
  /** Already passed through {@link clampCrewSizeForService} for the job. */
  normalizedRecommendedCrewSize: number;
  candidate: ResolvedFranchiseOwnerCrewRange;
  /** When set, assigned crew is at least this large when capacity allows. */
  workloadMinCrew?: number;
};

/**
 * Operational crew count used for slot duration and availability metadata.
 * Residential jobs never exceed the service cap even if the FO could send 11.
 */
export function computeAssignedCrewSize(args: AssignedCrewInput): number {
  const rec = Math.max(1, Math.floor(args.normalizedRecommendedCrewSize));
  const workloadFloor = Math.max(
    1,
    Math.floor(Number(args.workloadMinCrew ?? 1)),
  );
  const serviceMaxCap = getServiceMaxCrewSize(
    args.serviceType,
    args.serviceSegment,
  );
  const desiredFloor = Math.max(
    args.candidate.minCrewSize,
    rec,
    workloadFloor,
  );
  const assigned = Math.min(
    args.candidate.maxCrewSize,
    serviceMaxCap,
    desiredFloor,
  );
  return Math.max(
    args.candidate.minCrewSize,
    Math.min(assigned, args.candidate.maxCrewSize),
  );
}

/** Raw parallel elapsed minutes before scheduling floor. */
export function computeRawElapsedMinutesFromLabor(
  requiredLaborMinutes: number,
  assignedCrewSize: number,
): number {
  const labor = Math.max(1, Math.floor(Number(requiredLaborMinutes)));
  const crew = Math.max(1, Math.floor(Number(assignedCrewSize)));
  return Math.max(1, Math.ceil(labor / crew));
}

/**
 * Wall-clock minutes for slots / ranking: linear crew model, then {@link MIN_DURATION_MINUTES} floor.
 */
export function computeElapsedDurationMinutesFromLabor(
  requiredLaborMinutes: number,
  assignedCrewSize: number,
): number {
  const raw = computeRawElapsedMinutesFromLabor(
    requiredLaborMinutes,
    assignedCrewSize,
  );
  return Math.max(MIN_DURATION_MINUTES, raw);
}

/**
 * Ranking contribution for duration: shorter is better; long jobs (>8h effective) pick up a soft penalty.
 * Higher return value = better for descending sort when added to other score terms.
 */
export function computeDurationRankScore(durationMinutes: number): number {
  const d = Math.max(MIN_DURATION_MINUTES, Math.floor(Number(durationMinutes)));
  let score = -d * 0.15;
  if (d > SOFT_LONG_DURATION_THRESHOLD_MINUTES) {
    score -= (d - SOFT_LONG_DURATION_THRESHOLD_MINUTES) * 0.5;
  }
  return score;
}

/** Closer assigned crew to policy-clamped recommendation = better (higher score). */
export function computeCrewFitRankScore(
  assignedCrewSize: number,
  normalizedRecommendedCrewSize: number,
): number {
  return -Math.abs(
    Math.floor(assignedCrewSize) - Math.floor(normalizedRecommendedCrewSize),
  );
}

const MATCH_OPS_CREW_FIT_WEIGHT = 3;

/**
 * Descending-sort score for FO match ranking: legacy reliability/travel plus crew fit
 * (post-clamp assigned vs policy-clamped recommendation) and duration guardrails.
 */
export function computeMatchOpsRankScore(args: {
  reliabilityScore: number;
  travelMinutes: number;
  assignedCrewSize: number;
  normalizedRecommendedCrewSize: number;
  estimatedJobDurationMinutes: number;
}): number {
  const base = args.reliabilityScore * 2 - args.travelMinutes;
  return (
    base +
    MATCH_OPS_CREW_FIT_WEIGHT *
      computeCrewFitRankScore(
        args.assignedCrewSize,
        args.normalizedRecommendedCrewSize,
      ) +
    computeDurationRankScore(args.estimatedJobDurationMinutes)
  );
}
