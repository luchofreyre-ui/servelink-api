import type {
  DeepCleanEstimatorVersionComparisonApi,
  DeepCleanEstimatorVersionImpactRowApi,
} from "@/types/deepCleanEstimatorImpact";

export type DeepCleanEstimatorImpactComparisonDirection = "improved" | "worsened" | "flat";

export type DeepCleanEstimatorVersionImpactRowDisplay = DeepCleanEstimatorVersionImpactRowApi & {
  versionLabel: string;
};

export type DeepCleanEstimatorVersionComparisonDisplay = DeepCleanEstimatorVersionComparisonApi & {
  variancePercentDirection: DeepCleanEstimatorImpactComparisonDirection;
};

/** Delta is comparison − baseline on average variance % (API). */
export function classifyVariancePercentDeltaDirection(
  deltaVariancePercent: number | null,
): DeepCleanEstimatorImpactComparisonDirection {
  if (deltaVariancePercent == null || !Number.isFinite(deltaVariancePercent)) return "flat";
  if (deltaVariancePercent < -1) return "improved";
  if (deltaVariancePercent > 1) return "worsened";
  return "flat";
}

export function formatEstimatorVersionKey(version: number | null): string {
  if (version == null) return "unknown";
  return `v${version}`;
}

export function mapEstimatorImpactRowApiToDisplay(
  row: DeepCleanEstimatorVersionImpactRowApi,
): DeepCleanEstimatorVersionImpactRowDisplay {
  const v = row.estimatorConfigVersion;
  const fallback = formatEstimatorVersionKey(v);
  const label = row.estimatorConfigLabel?.trim();
  const versionLabel = label && label.length > 0 ? label : fallback;
  return { ...row, versionLabel };
}

export function mapEstimatorImpactComparisonApiToDisplay(
  row: DeepCleanEstimatorVersionComparisonApi,
): DeepCleanEstimatorVersionComparisonDisplay {
  return {
    ...row,
    variancePercentDirection: classifyVariancePercentDeltaDirection(row.deltaVariancePercent),
  };
}
