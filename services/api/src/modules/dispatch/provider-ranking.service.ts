import type { AssignmentConstraintSet } from "./assignment-capacity.contract";
import {
  PROVIDER_RANKING_PERSIST_TOP_N,
  PROVIDER_RANKING_WEIGHTS,
  type ProviderRankingFactor,
  type ProviderRankingFactorCode,
  type RankedCandidatePersistence,
  type RankedProviderCandidate,
  type RecommendationConfidence,
} from "./provider-ranking.contract";

export type RankProviderAvailableCleaner = {
  cleanerId: string;
  cleanerLabel: string;
  isActive?: boolean;
  supportsRecurring?: boolean;
  providerId?: string | null;
  serviceAreaZip5?: string | null;
  availableWindows?: Array<{
    label: string;
    start?: string | null;
    end?: string | null;
  }>;
};

export type RankProviderCandidatesInput = {
  constraints: AssignmentConstraintSet;
  availableCleaners: RankProviderAvailableCleaner[];
  recurringContext?: {
    priorCleanerId?: string | null;
    priorCleanerLabel?: string | null;
  };
  /** Optional 5-digit service area hint when intake/booking exposes it later. */
  intentServiceZip5?: string | null;
};

function factor(
  code: ProviderRankingFactorCode,
  weight: number,
  value: number,
  detail?: string | null,
): ProviderRankingFactor {
  const v = Math.max(0, Math.min(1, value));
  return {
    code,
    weight,
    value: v,
    contribution: weight * v,
    detail: detail ?? null,
  };
}

function matchesCleanerId(
  row: RankProviderAvailableCleaner,
  id: string,
): boolean {
  const t = id.trim();
  if (!t) return false;
  if (row.cleanerId.trim() === t) return true;
  if (row.providerId != null && row.providerId.trim() === t) return true;
  return false;
}

/**
 * Rough 0–1 overlap between scheduling hints and informational FoSchedule window labels.
 * Not slot-level truth — only a weak positive when some schedule signal exists.
 */
export function schedulePreferenceOverlapScore(
  preferredTime: string | null | undefined,
  preferredDayWindow: string | null | undefined,
  windows: RankProviderAvailableCleaner["availableWindows"],
): number {
  const hint = `${preferredTime ?? ""} ${preferredDayWindow ?? ""}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!hint || !windows?.length) return 0;
  const hay = windows.map((w) => w.label.toLowerCase()).join(" | ");
  const tokens = hint
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
  if (!tokens.length) return 0;
  let hits = 0;
  for (const t of tokens) {
    if (hay.includes(t)) hits++;
  }
  return hits > 0 ? Math.min(1, hits / tokens.length) : 0;
}

function sumScore(factors: ProviderRankingFactor[]): number {
  let s = 0;
  for (const f of factors) s += f.contribution;
  return Math.round(s * 1000) / 1000;
}

/**
 * Deterministic scored ranking of roster candidates for assignment recommendation.
 */
export function rankProviderCandidates(
  input: RankProviderCandidatesInput,
): RankedProviderCandidate[] {
  const { constraints, availableCleaners, recurringContext, intentServiceZip5 } =
    input;
  const cp = constraints.cleanerPreference;
  const sched = constraints.scheduling;
  const zipHint = intentServiceZip5?.trim() || null;

  const rows = availableCleaners.filter((c) => {
    const active = c.isActive === undefined || c.isActive !== false;
    return active;
  });

  const ranked: RankedProviderCandidate[] = rows.map((c) => {
    const factors: ProviderRankingFactor[] = [];

    const preferredMatch =
      cp.mode === "preferred_cleaner" &&
      Boolean(cp.cleanerId?.trim()) &&
      matchesCleanerId(c, cp.cleanerId!);
    factors.push(
      factor(
        "preferred_cleaner_match",
        PROVIDER_RANKING_WEIGHTS.preferredCleanerMatch,
        preferredMatch ? 1 : 0,
        preferredMatch ? "Handoff cleaner id matches roster row." : null,
      ),
    );

    const continuityMatch =
      constraints.recurring.pathKind === "recurring" &&
      Boolean(recurringContext?.priorCleanerId?.trim()) &&
      matchesCleanerId(c, recurringContext!.priorCleanerId!);
    factors.push(
      factor(
        "recurring_continuity_match",
        PROVIDER_RANKING_WEIGHTS.recurringContinuityMatch,
        continuityMatch ? 1 : 0,
        continuityMatch ? "Matches prior recurring franchise owner." : null,
      ),
    );

    factors.push(
      factor(
        "active_roster_match",
        PROVIDER_RANKING_WEIGHTS.activeRosterMatch,
        1,
        "Present on active roster query.",
      ),
    );

    const zip = c.serviceAreaZip5?.trim() || null;
    let serviceAreaMatch = false;
    if (zipHint && zip && zip.length >= 5 && zipHint.length >= 5) {
      serviceAreaMatch = zip.slice(0, 5) === zipHint.slice(0, 5);
    }
    factors.push(
      factor(
        "service_area_match",
        PROVIDER_RANKING_WEIGHTS.serviceAreaMatch,
        serviceAreaMatch ? 1 : 0,
        serviceAreaMatch ? `ZIP5 aligns with intent (${zipHint}).` : null,
      ),
    );

    const schedScore = schedulePreferenceOverlapScore(
      sched.preferredTime,
      sched.preferredDayWindow,
      c.availableWindows,
    );
    factors.push(
      factor(
        "schedule_preference_match",
        PROVIDER_RANKING_WEIGHTS.schedulePreferenceMatch,
        schedScore,
        schedScore > 0 ? "Scheduling hint overlaps informational window labels." : null,
      ),
    );

    const recurringSupport =
      constraints.recurring.pathKind === "recurring" &&
      c.supportsRecurring === true;
    factors.push(
      factor(
        "recurring_support_match",
        PROVIDER_RANKING_WEIGHTS.recurringSupportMatch,
        recurringSupport ? 1 : 0,
        recurringSupport ? "Roster marks recurring-capable provider." : null,
      ),
    );

    const hasWindows = Boolean(c.availableWindows && c.availableWindows.length > 0);
    factors.push(
      factor(
        "capacity_signal_present",
        PROVIDER_RANKING_WEIGHTS.capacitySignalPresent,
        hasWindows ? 1 : 0,
        hasWindows ? "FoSchedule windows attached (informational)." : null,
      ),
    );
    factors.push(
      factor(
        "capacity_signal_missing",
        PROVIDER_RANKING_WEIGHTS.capacitySignalMissing,
        hasWindows ? 0 : 1,
        hasWindows ? null : "No FoSchedule rows on roster row.",
      ),
    );

    const hasStrongSignal = factors.some(
      (f) =>
        f.code === "preferred_cleaner_match" ||
        f.code === "recurring_continuity_match",
    );
    const hasSecondary =
      schedScore > 0 ||
      serviceAreaMatch ||
      recurringSupport ||
      hasWindows;
    factors.push(
      factor(
        "manual_fallback",
        PROVIDER_RANKING_WEIGHTS.manualFallback,
        !hasStrongSignal && !hasSecondary ? 1 : 0,
        !hasStrongSignal && !hasSecondary
          ? "Only baseline roster presence (weak signal)."
          : null,
      ),
    );

    const score = sumScore(factors);
    return {
      cleanerId: c.cleanerId,
      cleanerLabel: c.cleanerLabel,
      score,
      rank: 0,
      matchedPreferredCleaner: preferredMatch,
      recurringContinuityCandidate: continuityMatch,
      factors,
    };
  });

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.cleanerId.localeCompare(b.cleanerId);
  });
  ranked.forEach((r, i) => {
    r.rank = i + 1;
  });
  return ranked;
}

export function toRankedCandidatesPersistence(
  ranked: RankedProviderCandidate[],
): RankedCandidatePersistence[] {
  return ranked.slice(0, PROVIDER_RANKING_PERSIST_TOP_N).map((r) => ({
    cleanerId: r.cleanerId,
    cleanerLabel: r.cleanerLabel,
    score: r.score,
    rank: r.rank,
    matchedPreferredCleaner: r.matchedPreferredCleaner,
    recurringContinuityCandidate: r.recurringContinuityCandidate,
    topFactors: [...r.factors]
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 4)
      .map((f) => ({
        code: f.code,
        contribution: f.contribution,
        detail: f.detail ?? null,
      })),
  }));
}

export function deriveRecommendationConfidence(args: {
  matchedPreferredCleaner: boolean;
  recurringContinuityCandidate: boolean;
  topRanked: RankedProviderCandidate | undefined;
}): RecommendationConfidence {
  if (args.matchedPreferredCleaner || args.recurringContinuityCandidate) {
    return "high";
  }
  const top = args.topRanked;
  if (!top) return "low";
  const strongSecondary = top.factors.some(
    (f) =>
      (f.code === "schedule_preference_match" && f.contribution >= 10) ||
      (f.code === "capacity_signal_present" && f.contribution > 0) ||
      (f.code === "service_area_match" && f.contribution > 0) ||
      (f.code === "recurring_support_match" && f.contribution > 0),
  );
  if (top.score >= 52 || strongSecondary) return "medium";
  return "low";
}

export function buildRecommendationReasonSummary(args: {
  confidence: RecommendationConfidence;
  matchedPreferredCleaner: boolean;
  recurringContinuityCandidate: boolean;
  topRanked?: RankedProviderCandidate;
}): string[] {
  const lines: string[] = [];
  lines.push(`confidence:${args.confidence}`);
  if (args.matchedPreferredCleaner) {
    lines.push("Preferred cleaner exact match on active roster.");
  }
  if (args.recurringContinuityCandidate) {
    lines.push("Recurring continuity cleaner matched active roster.");
  }
  if (args.topRanked) {
    lines.push(
      `Top ranked: ${args.topRanked.cleanerLabel} (score ${args.topRanked.score}).`,
    );
    const topCodes = args.topRanked.factors
      .filter((f) => f.contribution !== 0)
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 5)
      .map((f) => `${f.code}:${f.contribution}`);
    if (topCodes.length) lines.push(`Top factor contributions: ${topCodes.join(", ")}.`);
  }
  return lines;
}
