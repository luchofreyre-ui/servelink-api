import type { AuthorityDensityConfidence, AuthorityDensityEscalation, AuthorityDensitySeverity } from "@/authority/types/authorityDensityTypes";
import type { AuthorityProblemEscalationType, AuthorityProblemScienceConfidence, AuthorityProblemScienceProfile, AuthorityProblemSeverity } from "@/authority/types/authorityProblemScienceTypes";
import type { AuthoritySurfaceScienceProfile, SurfaceToleranceLevel } from "@/authority/types/authoritySurfaceScienceTypes";
import type { AuthorityWorkflowDecisionProfile } from "@/authority/types/authorityWorkflowTypes";
import type { SeverityBand, VisualDiagnosticProfile } from "@/lib/visual-authority/visualAuthorityTypes";

const SEVERITY_RANK: Record<AuthorityDensitySeverity, number> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

function maxSeverity(values: AuthorityDensitySeverity[]): AuthorityDensitySeverity {
  return values.reduce<AuthorityDensitySeverity>(
    (max, value) => (SEVERITY_RANK[value] > SEVERITY_RANK[max] ? value : max),
    "none",
  );
}

export function normalizeProblemSeverity(severity: AuthorityProblemSeverity): AuthorityDensitySeverity {
  switch (severity) {
    case "trace":
    case "light":
      return "low";
    case "moderate":
    case "recurring":
      return "moderate";
    case "heavy":
      return "high";
    case "likely_damage_or_embedded":
      return "critical";
  }
}

export function normalizeProblemProfileSeverity(
  profile: AuthorityProblemScienceProfile | null | undefined,
): AuthorityDensitySeverity {
  if (!profile) return "none";
  return maxSeverity(profile.severityLadder.map((step) => normalizeProblemSeverity(step.severity)));
}

export function normalizeVisualSeverity(severity: SeverityBand): AuthorityDensitySeverity {
  switch (severity) {
    case "not-applicable":
      return "none";
    case "mild":
      return "low";
    case "moderate":
      return "moderate";
    case "severe":
    case "failed":
      return "high";
    case "permanent-risk":
      return "critical";
  }
}

function surfaceToleranceRisk(level: SurfaceToleranceLevel): AuthorityDensitySeverity {
  switch (level) {
    case "high":
      return "low";
    case "moderate":
      return "moderate";
    case "low":
      return "high";
  }
}

export function normalizeSurfaceScienceSeverity(
  profile: AuthoritySurfaceScienceProfile | null | undefined,
): AuthorityDensitySeverity {
  if (!profile) return "none";
  return maxSeverity([
    surfaceToleranceRisk(profile.moistureTolerance.level),
    surfaceToleranceRisk(profile.abrasionTolerance.level),
    surfaceToleranceRisk(profile.chemicalSensitivity.level),
    profile.restorationBoundary.limits.length > 0 ? "moderate" : "none",
  ]);
}

export function normalizeVisualProfilesSeverity(
  profiles: readonly VisualDiagnosticProfile[],
): AuthorityDensitySeverity {
  return maxSeverity(profiles.map((profile) => normalizeVisualSeverity(profile.severityBand)));
}

export function normalizeAuthorityDensitySeverity(args: {
  surfaceScience?: AuthoritySurfaceScienceProfile | null;
  problemScience?: AuthorityProblemScienceProfile | null;
  visualProfiles?: readonly VisualDiagnosticProfile[];
}): AuthorityDensitySeverity {
  return maxSeverity([
    normalizeSurfaceScienceSeverity(args.surfaceScience),
    normalizeProblemProfileSeverity(args.problemScience),
    normalizeVisualProfilesSeverity(args.visualProfiles ?? []),
  ]);
}

export function normalizeAuthorityDensityConfidence(args: {
  problemConfidence?: AuthorityProblemScienceConfidence | null;
  visualProfiles?: readonly VisualDiagnosticProfile[];
  surfaceSciencePresent?: boolean;
}): AuthorityDensityConfidence {
  if (args.problemConfidence) return args.problemConfidence;
  if ((args.visualProfiles?.length ?? 0) > 0 && args.surfaceSciencePresent) return "medium";
  if ((args.visualProfiles?.length ?? 0) > 0) return "medium";
  return "low";
}

function uniqueEscalations(values: AuthorityDensityEscalation[]): AuthorityDensityEscalation[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function normalizeAuthorityDensityEscalation(args: {
  problemEscalation?: readonly AuthorityProblemEscalationType[];
  surfaceScience?: AuthoritySurfaceScienceProfile | null;
  workflowProfiles?: readonly AuthorityWorkflowDecisionProfile[];
  visualProfiles?: readonly VisualDiagnosticProfile[];
  missingScience?: boolean;
}): AuthorityDensityEscalation[] {
  const out: AuthorityDensityEscalation[] = [...(args.problemEscalation ?? [])];

  if (args.surfaceScience?.restorationBoundary.escalationSignals.length) {
    out.push("restoration_boundary");
  }
  if (args.workflowProfiles?.some((profile) => profile.safetyLogic.length > 0 || profile.escalationLogic.length > 0)) {
    out.push("workflow_safety");
  }
  if (args.visualProfiles?.some((profile) => profile.workflowStage.includes("stop") || profile.stopCondition.trim())) {
    out.push("visual_stop");
  }
  if (args.missingScience) {
    out.push("missing_science_profile");
  }

  return uniqueEscalations(out);
}
