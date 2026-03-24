import type {
  DeepCleanEstimatorVersionComparisonApi,
  DeepCleanEstimatorVersionImpactRowApi,
} from "@/types/deepCleanEstimatorImpact";

/** Headers + string cells for spreadsheets (no file I/O). */
export function buildEstimatorImpactVersionExportRows(
  rows: DeepCleanEstimatorVersionImpactRowApi[],
): { headers: string[]; rows: string[][] } {
  const headers = [
    "estimatorConfigVersion",
    "estimatorConfigLabel",
    "programCount",
    "usableProgramCount",
    "reviewedProgramCount",
    "averageVarianceMinutes",
    "averageVariancePercent",
    "underestimationTagCount",
    "overestimationTagCount",
    "estimatorIssueCount",
    "operationalIssueCount",
    "scopeIssueCount",
    "dataQualityIssueCount",
    "mixedIssueCount",
    "otherIssueCount",
  ];
  const body = rows.map((r) => [
    r.estimatorConfigVersion == null ? "" : String(r.estimatorConfigVersion),
    r.estimatorConfigLabel ?? "",
    String(r.programCount),
    String(r.usableProgramCount),
    String(r.reviewedProgramCount),
    r.averageVarianceMinutes == null ? "" : String(r.averageVarianceMinutes),
    r.averageVariancePercent == null ? "" : String(r.averageVariancePercent),
    String(r.underestimationTagCount),
    String(r.overestimationTagCount),
    String(r.estimatorIssueCount),
    String(r.operationalIssueCount),
    String(r.scopeIssueCount),
    String(r.dataQualityIssueCount),
    String(r.mixedIssueCount),
    String(r.otherIssueCount),
  ]);
  return { headers, rows: body };
}

export function buildEstimatorImpactComparisonExportRows(
  comparisons: DeepCleanEstimatorVersionComparisonApi[],
): { headers: string[]; rows: string[][] } {
  const headers = [
    "baselineVersion",
    "comparisonVersion",
    "baselineAverageVariancePercent",
    "comparisonAverageVariancePercent",
    "deltaVariancePercent",
    "baselineAverageVarianceMinutes",
    "comparisonAverageVarianceMinutes",
    "deltaVarianceMinutes",
  ];
  const body = comparisons.map((c) => [
    String(c.baselineVersion),
    String(c.comparisonVersion),
    c.baselineAverageVariancePercent == null ? "" : String(c.baselineAverageVariancePercent),
    c.comparisonAverageVariancePercent == null ? "" : String(c.comparisonAverageVariancePercent),
    c.deltaVariancePercent == null ? "" : String(c.deltaVariancePercent),
    c.baselineAverageVarianceMinutes == null ? "" : String(c.baselineAverageVarianceMinutes),
    c.comparisonAverageVarianceMinutes == null ? "" : String(c.comparisonAverageVarianceMinutes),
    c.deltaVarianceMinutes == null ? "" : String(c.deltaVarianceMinutes),
  ]);
  return { headers, rows: body };
}
