import type {
  DeepCleanEstimatorVersionComparisonDisplay,
  DeepCleanEstimatorVersionImpactRowDisplay,
} from "@/mappers/deepCleanEstimatorImpactMappers";

function absVariancePct(row: DeepCleanEstimatorVersionImpactRowDisplay): number | null {
  const p = row.averageVariancePercent;
  if (p == null || !Number.isFinite(p)) return null;
  return Math.abs(p);
}

/**
 * Among rows with a finite average variance %, pick the one closest to zero (smallest absolute %).
 * Tie-break: higher estimatorConfigVersion wins.
 */
export function getBestVersionByVariance(
  rows: DeepCleanEstimatorVersionImpactRowDisplay[],
): DeepCleanEstimatorVersionImpactRowDisplay | null {
  let best: DeepCleanEstimatorVersionImpactRowDisplay | null = null;
  let bestAbs: number | null = null;
  for (const r of rows) {
    const a = absVariancePct(r);
    if (a == null) continue;
    if (
      best == null ||
      bestAbs == null ||
      a < bestAbs ||
      (a === bestAbs &&
        (r.estimatorConfigVersion ?? -Infinity) > (best.estimatorConfigVersion ?? -Infinity))
    ) {
      best = r;
      bestAbs = a;
    }
  }
  return best;
}

/** Furthest from zero by absolute average variance %. Tie-break: higher version. */
export function getWorstVersionByVariance(
  rows: DeepCleanEstimatorVersionImpactRowDisplay[],
): DeepCleanEstimatorVersionImpactRowDisplay | null {
  let worst: DeepCleanEstimatorVersionImpactRowDisplay | null = null;
  let worstAbs: number | null = null;
  for (const r of rows) {
    const a = absVariancePct(r);
    if (a == null) continue;
    if (
      worst == null ||
      worstAbs == null ||
      a > worstAbs ||
      (a === worstAbs &&
        (r.estimatorConfigVersion ?? -Infinity) > (worst.estimatorConfigVersion ?? -Infinity))
    ) {
      worst = r;
      worstAbs = a;
    }
  }
  return worst;
}

export function getLatestVersion(
  rows: DeepCleanEstimatorVersionImpactRowDisplay[],
): DeepCleanEstimatorVersionImpactRowDisplay | null {
  let latest: DeepCleanEstimatorVersionImpactRowDisplay | null = null;
  let vMax = -Infinity;
  for (const r of rows) {
    const v = r.estimatorConfigVersion;
    if (v == null || !Number.isFinite(v)) continue;
    if (v > vMax) {
      vMax = v;
      latest = r;
    }
  }
  return latest;
}

/** Last adjacent pair in ascending version order (highest baseline in the chain). */
export function getMostRecentComparison(
  comparisons: DeepCleanEstimatorVersionComparisonDisplay[],
): DeepCleanEstimatorVersionComparisonDisplay | null {
  if (comparisons.length === 0) return null;
  return comparisons[comparisons.length - 1] ?? null;
}

export type DominantReviewPattern =
  | { pattern: "underestimation"; count: number }
  | { pattern: "overestimation"; count: number }
  | { pattern: "tie_under_over"; count: number }
  | { pattern: "none"; count: 0 };

/** Uses reviewed-only tag counts from the API row (already scoped to reviewed programs). */
export function getDominantUnderOverPattern(
  row: DeepCleanEstimatorVersionImpactRowDisplay,
): DominantReviewPattern {
  const u = row.underestimationTagCount;
  const o = row.overestimationTagCount;
  if (u <= 0 && o <= 0) return { pattern: "none", count: 0 };
  if (u > o) return { pattern: "underestimation", count: u };
  if (o > u) return { pattern: "overestimation", count: o };
  return { pattern: "tie_under_over", count: u };
}
