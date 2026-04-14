/**
 * Canonical provider ranking / scoring for first-pass assignment recommendation.
 * Scoring implementation: `provider-ranking.service.ts`.
 */

export type ProviderRankingFactorCode =
  | "preferred_cleaner_match"
  | "recurring_continuity_match"
  | "active_roster_match"
  | "service_area_match"
  | "schedule_preference_match"
  | "recurring_support_match"
  | "capacity_signal_present"
  | "capacity_signal_missing"
  | "manual_fallback";

export type ProviderRankingFactor = {
  code: ProviderRankingFactorCode;
  weight: number;
  value: number;
  contribution: number;
  detail?: string | null;
};

export type RankedProviderCandidate = {
  cleanerId: string;
  cleanerLabel: string;
  score: number;
  rank: number;
  matchedPreferredCleaner: boolean;
  recurringContinuityCandidate: boolean;
  factors: ProviderRankingFactor[];
};

/** How trustworthy the primary recommendation is (ops + product honesty). */
export type RecommendationConfidence = "high" | "medium" | "low";

/** Compact snapshot for `assignmentExecution.evaluation` (admin + persistence). */
export type RankedCandidatePersistence = {
  cleanerId: string;
  cleanerLabel: string;
  score: number;
  rank: number;
  matchedPreferredCleaner: boolean;
  recurringContinuityCandidate: boolean;
  topFactors: Array<{
    code: ProviderRankingFactorCode;
    contribution: number;
    detail?: string | null;
  }>;
};

export const PROVIDER_RANKING_WEIGHTS = {
  preferredCleanerMatch: 100,
  recurringContinuityMatch: 90,
  activeRosterMatch: 30,
  serviceAreaMatch: 25,
  schedulePreferenceMatch: 20,
  recurringSupportMatch: 15,
  capacitySignalPresent: 10,
  capacitySignalMissing: -10,
  manualFallback: 1,
} as const;

/** Persist at most this many ranked rows on intake execution. */
export const PROVIDER_RANKING_PERSIST_TOP_N = 3;
