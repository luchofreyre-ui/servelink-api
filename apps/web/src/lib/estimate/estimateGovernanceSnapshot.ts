/**
 * Web-local, defensive reads for persisted booking estimate snapshot `outputJson`.
 * Mirrors `services/api` governance selectors only for admin UI — keep aligned when changing snapshot shape.
 * Older rows omit `confidenceBreakdown` / `escalationGovernance`; callers must tolerate absence.
 */

export function tryParseEstimateSnapshotOutputJson(
  raw: string | null | undefined,
): Record<string, unknown> | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Tolerant read of confidence breakdown from parsed snapshot root. */
export function getConfidenceBreakdownFromSnapshot(
  parsed: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  const raw = parsed?.confidenceBreakdown;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return raw as Record<string, unknown>;
}

/** Tolerant read of escalation governance from parsed snapshot root. */
export function getEscalationGovernanceFromSnapshot(
  parsed: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  const raw = parsed?.escalationGovernance;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return raw as Record<string, unknown>;
}

export type SnapshotGovernanceDomainRow = {
  domainKey: string;
  domainLabel: string;
  score: number;
  classification: string;
  uncertaintyDrivers: string[];
};

const DOMAIN_ENTRIES: ReadonlyArray<{ jsonKey: string; label: string }> = [
  { jsonKey: "conditionConfidence", label: "Condition" },
  { jsonKey: "clutterConfidence", label: "Clutter" },
  { jsonKey: "kitchenConfidence", label: "Kitchen" },
  { jsonKey: "bathroomConfidence", label: "Bathroom" },
  { jsonKey: "petConfidence", label: "Pet" },
  { jsonKey: "recencyConfidence", label: "Recency" },
  { jsonKey: "recurringTransitionConfidence", label: "Recurring transition" },
  { jsonKey: "customerConsistencyConfidence", label: "Customer consistency" },
  { jsonKey: "scopeCompletenessConfidence", label: "Scope completeness" },
];

function readDomainSignals(obj: unknown): {
  score: number;
  classification: string;
  uncertaintyDrivers: string[];
} | null {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  const r = obj as Record<string, unknown>;
  const scoreRaw = r.score;
  const score =
    typeof scoreRaw === "number" && Number.isFinite(scoreRaw)
      ? scoreRaw
      : typeof scoreRaw === "string" && Number.isFinite(Number.parseFloat(scoreRaw))
        ? Number.parseFloat(scoreRaw)
        : null;
  if (score === null) return null;
  const classification =
    typeof r.classification === "string" && r.classification.trim()
      ? r.classification.trim()
      : "unknown";
  const driversRaw = r.uncertaintyDrivers;
  const uncertaintyDrivers =
    Array.isArray(driversRaw) && driversRaw.every((x) => typeof x === "string")
      ? [...new Set(driversRaw as string[])].sort((a, b) => a.localeCompare(b))
      : [];
  return { score, classification, uncertaintyDrivers };
}

/** Sorted weakest domains first (by score ascending). */
export function getWeakestConfidenceDomains(
  breakdown: Record<string, unknown> | null | undefined,
  limit = 4,
): SnapshotGovernanceDomainRow[] {
  if (!breakdown) return [];
  const rows: SnapshotGovernanceDomainRow[] = [];
  for (const { jsonKey, label } of DOMAIN_ENTRIES) {
    const block = readDomainSignals(breakdown[jsonKey]);
    if (!block) continue;
    rows.push({
      domainKey: jsonKey,
      domainLabel: label,
      score: block.score,
      classification: block.classification,
      uncertaintyDrivers: block.uncertaintyDrivers,
    });
  }
  return [...rows]
    .sort((a, b) => a.score - b.score || a.domainKey.localeCompare(b.domainKey))
    .slice(0, Math.max(0, limit));
}

/** Union of uncertainty drivers across all domains (deterministic sort). */
export function getTopUncertaintyDrivers(
  breakdown: Record<string, unknown> | null | undefined,
  limit = 14,
): string[] {
  if (!breakdown) return [];
  const acc = new Set<string>();
  for (const { jsonKey } of DOMAIN_ENTRIES) {
    const block = readDomainSignals(breakdown[jsonKey]);
    if (!block) continue;
    for (const d of block.uncertaintyDrivers) acc.add(d);
  }
  return [...acc].sort((a, b) => a.localeCompare(b)).slice(0, Math.max(0, limit));
}

export type EscalationGovernanceSummary = {
  escalationLevel: string | null;
  severityScore: number | null;
  recommendedActions: string[];
  blockingReasons: string[];
  escalationReasons: string[];
};

export function getEscalationSummary(
  governance: Record<string, unknown> | null | undefined,
): EscalationGovernanceSummary {
  if (!governance) {
    return {
      escalationLevel: null,
      severityScore: null,
      recommendedActions: [],
      blockingReasons: [],
      escalationReasons: [],
    };
  }
  const levelRaw = governance.escalationLevel;
  const escalationLevel =
    typeof levelRaw === "string" && levelRaw.trim() ? levelRaw.trim() : null;

  const sevRaw = governance.severityScore;
  let severityScore: number | null = null;
  if (typeof sevRaw === "number" && Number.isFinite(sevRaw)) severityScore = Math.round(sevRaw);
  else if (typeof sevRaw === "string" && Number.isFinite(Number.parseFloat(sevRaw))) {
    severityScore = Math.round(Number.parseFloat(sevRaw));
  }

  const stringArray = (k: string): string[] => {
    const v = governance[k];
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((s) => s.trim())
      .sort((a, b) => a.localeCompare(b));
  };

  return {
    escalationLevel,
    severityScore,
    recommendedActions: stringArray("recommendedActions"),
    blockingReasons: stringArray("blockingReasons"),
    escalationReasons: stringArray("escalationReasons"),
  };
}

/** Subset of drivers used for intake / stability surfacing in admin UI. */
export function getIntakeStabilityDriverHits(topDrivers: readonly string[]): string[] {
  const hitSet = new Set<string>();
  const markers = [
    "structured_intake_gaps",
    "cadence_vs_recency_mismatch",
    "legacy_recency_unstable_for_recurring",
    "recurring_price_collapse_vs_prior",
    "pet_presence_unknown",
    "pet_impact_vs_presence_conflict",
    "pet_shedding_missing",
    "pet_accidents_ambiguous",
    "recency_unknown_dual_channel",
    "structured_recency_stale_or_unknown",
    "recency_cross_channel_conflict",
    "first_time_unknown",
    "occupancy_vs_access_conflict",
    "occupancy_vs_clutter_band_conflict",
    "clutter_access_vs_band_conflict",
    "condition_cross_signal_conflict",
    "kitchen_intensity_missing",
  ];
  const markerSet = new Set(markers);
  for (const d of topDrivers) {
    if (markerSet.has(d)) hitSet.add(d);
  }
  return [...hitSet].sort((a, b) => a.localeCompare(b));
}

const ESCALATION_GOVERNANCE_SCHEMA = "estimate_escalation_governance_v1";
const CONFIDENCE_BREAKDOWN_SCHEMA = "estimate_confidence_breakdown_v1";

const RECURRING_INSTABILITY_UNCERTAINTY_MARKERS = new Set([
  "legacy_recency_unstable_for_recurring",
  "cadence_vs_recency_mismatch",
]);

/** Compact ops-facing governance lane — aligned with API list payloads. */
export type EstimateGovernanceSummary = {
  escalationLevel: string;
  severityScore: number;
  confidenceClassification: string;
  weakestDomainCount: number;
  criticalDomainCount: number;
  lowDomainCount: number;
  hasRecurringInstability: boolean;
  hasPriceCollapseSignal: boolean;
  hasSparseIntakeSignal: boolean;
  recommendedActionCount: number;
  bookingDetailAnchor: "#estimate-governance";
};

function countDomainClassificationBuckets(
  breakdown: Record<string, unknown> | null | undefined,
): {
  criticalDomainCount: number;
  lowDomainCount: number;
  weakestDomainCount: number;
  confidenceClassification: string | null;
} {
  if (
    !breakdown ||
    breakdown.schemaVersion !== CONFIDENCE_BREAKDOWN_SCHEMA
  ) {
    return {
      criticalDomainCount: 0,
      lowDomainCount: 0,
      weakestDomainCount: 0,
      confidenceClassification: null,
    };
  }
  let criticalDomainCount = 0;
  let lowDomainCount = 0;
  for (const { jsonKey } of DOMAIN_ENTRIES) {
    const block = readDomainSignals(breakdown[jsonKey]);
    if (!block) continue;
    if (block.classification === "critical") criticalDomainCount += 1;
    else if (block.classification === "low") lowDomainCount += 1;
  }
  const overallRaw = breakdown.confidenceClassification;
  const confidenceClassification =
    typeof overallRaw === "string" && overallRaw.trim()
      ? overallRaw.trim()
      : null;

  return {
    criticalDomainCount,
    lowDomainCount,
    weakestDomainCount: criticalDomainCount + lowDomainCount,
    confidenceClassification,
  };
}

function governanceConfidenceClassificationEcho(
  governance: Record<string, unknown>,
): string | null {
  const ci = governance.confidenceInputs;
  if (!ci || typeof ci !== "object" || Array.isArray(ci)) return null;
  const cc = (ci as Record<string, unknown>).confidenceClassification;
  return typeof cc === "string" && cc.trim() ? cc.trim() : null;
}

/**
 * Builds a compact summary from persisted snapshot JSON for client-side display when API omits it.
 * Returns null for legacy snapshots, missing governance, wrong schema, or malformed JSON.
 */
export function buildEstimateGovernanceSummaryFromSnapshotOutputJson(
  outputJson: string | null | undefined,
): EstimateGovernanceSummary | null {
  try {
    const parsed = tryParseEstimateSnapshotOutputJson(outputJson);
    if (!parsed) return null;
    const govRaw = getEscalationGovernanceFromSnapshot(parsed);
    if (!govRaw || govRaw.schemaVersion !== ESCALATION_GOVERNANCE_SCHEMA) {
      return null;
    }

    const esc = getEscalationSummary(govRaw);
    const breakdown = getConfidenceBreakdownFromSnapshot(parsed);
    const buckets = countDomainClassificationBuckets(breakdown ?? undefined);

    const topDrivers = getTopUncertaintyDrivers(breakdown, 80);
    const driverHits = new Set(topDrivers);
    const hasPriceCollapseSignal = driverHits.has(
      "recurring_price_collapse_vs_prior",
    );
    const hasSparseIntakeSignal = driverHits.has("structured_intake_gaps");

    const recurringBlock = readDomainSignals(
      breakdown?.recurringTransitionConfidence,
    );
    const hasRecurringDriverHit = [
      ...RECURRING_INSTABILITY_UNCERTAINTY_MARKERS,
    ].some((m) => driverHits.has(m));
    const hasWeakRecurringDomain =
      recurringBlock != null &&
      (recurringBlock.classification === "low" ||
        recurringBlock.classification === "critical");
    const hasRecurringInstability =
      hasRecurringDriverHit || hasWeakRecurringDomain;

    let confidenceClassification =
      buckets.confidenceClassification ??
      governanceConfidenceClassificationEcho(govRaw);
    if (!confidenceClassification) confidenceClassification = "unknown";

    const escalationLevel = esc.escalationLevel?.trim() || "none";
    const severityScore =
      typeof esc.severityScore === "number" && Number.isFinite(esc.severityScore)
        ? esc.severityScore
        : 0;

    return {
      escalationLevel,
      severityScore,
      confidenceClassification,
      weakestDomainCount: buckets.weakestDomainCount,
      criticalDomainCount: buckets.criticalDomainCount,
      lowDomainCount: buckets.lowDomainCount,
      hasRecurringInstability,
      hasPriceCollapseSignal,
      hasSparseIntakeSignal,
      recommendedActionCount: esc.recommendedActions.length,
      bookingDetailAnchor: "#estimate-governance",
    };
  } catch {
    return null;
  }
}

export const RECURRING_ECONOMICS_GOVERNANCE_SCHEMA = "recurring_economics_governance_v1";

export function getRecurringEconomicsGovernanceFromSnapshot(
  parsed: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  const raw = parsed?.recurringEconomicsGovernance;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return raw as Record<string, unknown>;
}

/** Compact recurring economics lane — aligned with API list payloads. */
export type RecurringEconomicsSummary = {
  economicRiskLevel: string;
  maintenanceViability: string;
  resetReviewRecommendation: string;
  marginProtectionSignal: string;
  riskScore: number;
  recommendedActionCount: number;
  hasDiscountRisk: boolean;
  hasResetRisk: boolean;
  hasMarginProtection: boolean;
  bookingDetailAnchor: "#estimate-governance";
};

function readRecurringString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function readRecurringRiskScore(obj: Record<string, unknown>): number {
  const v = obj.riskScore;
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return Math.round(Math.max(0, Math.min(100, v)));
}

export function buildRecurringEconomicsSummaryFromParsedOutput(
  parsed: Record<string, unknown> | null | undefined,
): RecurringEconomicsSummary | null {
  try {
    const row = getRecurringEconomicsGovernanceFromSnapshot(parsed ?? undefined);
    if (!row || row.schemaVersion !== RECURRING_ECONOMICS_GOVERNANCE_SCHEMA) {
      return null;
    }
    const discount = readRecurringString(row, "recurringDiscountRisk") ?? "none";
    const reset = readRecurringString(row, "resetReviewRecommendation") ?? "none";
    const margin = readRecurringString(row, "marginProtectionSignal") ?? "none";
    const actionsRaw = row.recommendedActions;
    const recommendedActionCount = Array.isArray(actionsRaw)
      ? actionsRaw.filter((x) => typeof x === "string").length
      : 0;
    const hasDiscountRisk =
      discount === "medium" || discount === "high" || discount === "critical";
    const hasResetRisk = reset === "suggested" || reset === "required";
    const hasMarginProtection =
      margin === "monitor" || margin === "review" || margin === "protect";
    return {
      economicRiskLevel:
        readRecurringString(row, "economicRiskLevel") ?? "unknown",
      maintenanceViability:
        readRecurringString(row, "maintenanceViability") ?? "unknown",
      resetReviewRecommendation: reset,
      marginProtectionSignal: margin,
      riskScore: readRecurringRiskScore(row),
      recommendedActionCount,
      hasDiscountRisk,
      hasResetRisk,
      hasMarginProtection,
      bookingDetailAnchor: "#estimate-governance",
    };
  } catch {
    return null;
  }
}

/** Tolerant read — never throws for malformed optional blobs. */
export function readGovernanceLevelFromSnapshotOutputJson(
  raw: string | null | undefined,
): string | null {
  const parsed = tryParseEstimateSnapshotOutputJson(raw);
  const gov = getEscalationGovernanceFromSnapshot(parsed ?? undefined);
  const level = gov?.escalationLevel;
  return typeof level === "string" ? level : null;
}
