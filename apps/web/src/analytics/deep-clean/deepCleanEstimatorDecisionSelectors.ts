import { getActiveVersion } from "@/analytics/deep-clean/deepCleanEstimatorGovernanceSelectors";
import {
  getBestVersionByVariance,
  getLatestVersion,
  getWorstVersionByVariance,
} from "@/analytics/deep-clean/deepCleanEstimatorImpactSelectors";
import {
  mapEstimatorImpactRowApiToDisplay,
} from "@/mappers/deepCleanEstimatorImpactMappers";
import type { DeepCleanEstimatorVersionHistoryRowApi } from "@/types/deepCleanEstimatorGovernance";
import type { DeepCleanEstimatorVersionImpactRowApi } from "@/types/deepCleanEstimatorImpact";

export type DeepCleanEstimatorDecisionDashboard = {
  activeVersion: number | null;
  activeLabel: string | null;
  bestVarianceVersionLabel: string | null;
  worstVarianceVersionLabel: string | null;
  latestImpactVersionLabel: string | null;
  impactRowCount: number;
};

export function buildEstimatorDecisionDashboard(input: {
  governanceRows: DeepCleanEstimatorVersionHistoryRowApi[];
  impactRows: DeepCleanEstimatorVersionImpactRowApi[];
}): DeepCleanEstimatorDecisionDashboard {
  const active = getActiveVersion(input.governanceRows);
  const rowsDisplay = input.impactRows.map(mapEstimatorImpactRowApiToDisplay);
  const best = getBestVersionByVariance(rowsDisplay);
  const worst = getWorstVersionByVariance(rowsDisplay);
  const latest = getLatestVersion(rowsDisplay);

  return {
    activeVersion: active?.version ?? null,
    activeLabel: active?.label ?? null,
    bestVarianceVersionLabel: best?.versionLabel ?? null,
    worstVarianceVersionLabel: worst?.versionLabel ?? null,
    latestImpactVersionLabel: latest?.versionLabel ?? null,
    impactRowCount: input.impactRows.length,
  };
}
