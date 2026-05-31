import {
  translateAuthorityDensityConfidence,
  translateAuthorityDensityRisk,
  translateAuthorityDensityWorkflow,
} from "@/authority/data/authorityDensityPresentationRules";
import type { AuthorityDensityBridge } from "@/authority/types/authorityDensityTypes";
import type { AuthorityDensityPresentation } from "@/authority/types/authorityDensityPresentationTypes";

function firstNonEmpty(values: readonly (string | null | undefined)[]): string | null {
  return values.find((value): value is string => Boolean(value?.trim())) ?? null;
}

function buildStopGuidance(bridge: AuthorityDensityBridge): string | null {
  const visualStop = firstNonEmpty(bridge.visualProfiles.map((profile) => profile.stopCondition));
  const remediationStop = firstNonEmpty(
    bridge.problemScience?.remediationLadder.map((step) => step.stopCondition) ?? [],
  );

  if (visualStop) return visualStop;
  if (remediationStop) return remediationStop;
  if (bridge.normalizedSeverity === "critical") {
    return "Stop if the mark behaves like finish damage instead of removable residue.";
  }
  return null;
}

function buildHelperText(bridge: AuthorityDensityBridge): string | null {
  const nextAction = firstNonEmpty(bridge.visualProfiles.map((profile) => profile.nextAction));
  if (nextAction) return nextAction;

  const diagnosticCheck = bridge.problemScience?.diagnosticChecks[0]?.check;
  if (diagnosticCheck) return diagnosticCheck;

  return null;
}

export function getAuthorityDensityPresentation(
  bridge: AuthorityDensityBridge,
): AuthorityDensityPresentation {
  const riskLabel = translateAuthorityDensityRisk({
    severity: bridge.normalizedSeverity,
    escalations: bridge.normalizedEscalation,
  });

  return {
    confidenceLabel: translateAuthorityDensityConfidence(bridge.normalizedConfidence),
    riskLabel,
    actionLabels: translateAuthorityDensityWorkflow(bridge.recommendedWorkflowStages),
    stopGuidance: riskLabel === "Routine care" ? null : buildStopGuidance(bridge),
    helperText: buildHelperText(bridge),
  };
}
