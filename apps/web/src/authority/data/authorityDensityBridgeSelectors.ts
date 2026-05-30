import { getAuthorityProblemScienceProfile } from "@/authority/data/authorityProblemScienceSelectors";
import { getSurfaceScienceProfile } from "@/authority/data/authoritySurfaceScienceModel";
import {
  getVisualDiagnosticSlugsForAuthorityProblem,
  getVisualDiagnosticSlugsForAuthoritySurface,
  normalizeAuthorityProblemSlug,
  normalizeAuthoritySurfaceSlug,
} from "@/authority/data/authorityDensitySlugMap";
import {
  normalizeAuthorityDensityConfidence,
  normalizeAuthorityDensityEscalation,
  normalizeAuthorityDensitySeverity,
} from "@/authority/data/authorityDensityNormalization";
import {
  getWorkflowDecisionProfilesForProblem,
  getWorkflowDecisionProfilesForSurface,
} from "@/authority/data/authorityWorkflowDecisionSelectors";
import type {
  AuthorityDensityBridge,
  AuthorityDensityBridgeInput,
  AuthorityDensityCompatibilityWarning,
} from "@/authority/types/authorityDensityTypes";
import type { AuthorityWorkflowDecisionProfile } from "@/authority/types/authorityWorkflowTypes";
import type { VisualDiagnosticProfile, WorkflowStage } from "@/lib/visual-authority/visualAuthorityTypes";
import { getVisualDiagnosticProfileBySlug } from "@/lib/visual-authority/visualDiagnosticSelectors";
import { validateVisualDiagnosticProfile } from "@/lib/visual-authority/visualDiagnosticValidation";

const WORKFLOW_STAGE_ORDER: WorkflowStage[] = [
  "inspect",
  "identify",
  "pretest",
  "treat",
  "dwell",
  "agitate",
  "rinse",
  "dry",
  "verify",
  "stop",
];

function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function isGovernedVisualDiagnosticProfile(profile: VisualDiagnosticProfile): boolean {
  return (
    validateVisualDiagnosticProfile(profile).valid &&
    profile.diagnosticClaim.trim().length > 0 &&
    profile.visibleMarkers.length > 0 &&
    profile.visualPurpose.length > 0
  );
}

function getBridgeVisualProfiles(problemSlug: string, surfaceSlug?: string): VisualDiagnosticProfile[] {
  const visualSlugs = [
    ...getVisualDiagnosticSlugsForAuthorityProblem(problemSlug),
    ...(surfaceSlug ? getVisualDiagnosticSlugsForAuthoritySurface(surfaceSlug) : []),
  ];

  return uniqueBy(
    visualSlugs
      .map((slug) => getVisualDiagnosticProfileBySlug(slug))
      .filter((profile): profile is VisualDiagnosticProfile => Boolean(profile))
      .filter(isGovernedVisualDiagnosticProfile),
    (profile) => profile.slug,
  );
}

function getBridgeWorkflowProfiles(problemSlug: string, surfaceSlug?: string): AuthorityWorkflowDecisionProfile[] {
  const problemProfiles = getWorkflowDecisionProfilesForProblem(problemSlug);
  const surfaceProfiles = surfaceSlug ? getWorkflowDecisionProfilesForSurface(surfaceSlug) : [];
  return uniqueBy([...problemProfiles, ...surfaceProfiles], (profile) => profile.slug);
}

function stageFromText(input: string): WorkflowStage[] {
  const text = input.toLowerCase();
  const stages: WorkflowStage[] = [];

  if (/\b(inspect|map|assess|check|confirm)\b/.test(text)) stages.push("inspect");
  if (/\b(identify|separate|diagnos|soil lanes?)\b/.test(text)) stages.push("identify");
  if (/\b(pretest|test patch|small section|controlled patch)\b/.test(text)) stages.push("pretest");
  if (/\b(treat|clean|apply|reset|remove)\b/.test(text)) stages.push("treat");
  if (/\b(dwell|contact time)\b/.test(text)) stages.push("dwell");
  if (/\b(agitat|brush|scrub)\b/.test(text)) stages.push("agitate");
  if (/\b(rinse|recover|extract|recovery)\b/.test(text)) stages.push("rinse");
  if (/\b(dry|ventilat|dry-down|buff)\b/.test(text)) stages.push("dry");
  if (/\b(verify|reassess|inspect after|dry inspection)\b/.test(text)) stages.push("verify");
  if (/\b(stop|escalat|professional|replacement|damage)\b/.test(text)) stages.push("stop");

  return stages;
}

function getRecommendedWorkflowStages(
  workflows: readonly AuthorityWorkflowDecisionProfile[],
  visuals: readonly VisualDiagnosticProfile[],
): WorkflowStage[] {
  const stages = new Set<WorkflowStage>();

  for (const visual of visuals) {
    for (const stage of visual.workflowStage) stages.add(stage);
  }

  for (const workflow of workflows) {
    for (const phase of workflow.sequenceLogic) {
      for (const stage of stageFromText(`${phase.phase} ${phase.reason}`)) stages.add(stage);
    }
    for (const failure of workflow.failureAnalysis) {
      for (const stage of stageFromText(`${failure.signal} ${failure.diagnosticResponse}`)) stages.add(stage);
    }
    for (const escalation of workflow.escalationLogic) {
      for (const stage of stageFromText(`${escalation.trigger} ${escalation.reason}`)) stages.add(stage);
    }
  }

  return WORKFLOW_STAGE_ORDER.filter((stage) => stages.has(stage));
}

function buildCompatibilityWarnings(args: {
  requestedProblemSlug: string;
  canonicalProblemSlug: string | null;
  requestedSurfaceSlug?: string;
  canonicalSurfaceSlug: string | null;
  surfaceSciencePresent: boolean;
  problemSciencePresent: boolean;
  workflowProfiles: readonly AuthorityWorkflowDecisionProfile[];
  visualProfiles: readonly VisualDiagnosticProfile[];
}): AuthorityDensityCompatibilityWarning[] {
  const warnings: AuthorityDensityCompatibilityWarning[] = [];

  if (!args.canonicalProblemSlug) {
    warnings.push({
      source: "problem",
      message: `No canonical authority problem slug for ${args.requestedProblemSlug}.`,
    });
  } else if (!args.problemSciencePresent) {
    warnings.push({
      source: "problem",
      message: `No problem science profile for ${args.canonicalProblemSlug}.`,
    });
  }

  if (args.requestedSurfaceSlug && !args.canonicalSurfaceSlug) {
    warnings.push({
      source: "surface",
      message: `No canonical authority surface slug for ${args.requestedSurfaceSlug}.`,
    });
  } else if (args.requestedSurfaceSlug && !args.surfaceSciencePresent) {
    warnings.push({
      source: "surface",
      message: `No surface science profile for ${args.canonicalSurfaceSlug}.`,
    });
  }

  if (args.workflowProfiles.length === 0) {
    warnings.push({
      source: "workflow",
      message: "No workflow decision profile matched this bridge request.",
    });
  }

  if (args.visualProfiles.length === 0) {
    warnings.push({
      source: "visual",
      message: "No governed visual diagnostic profile matched this bridge request.",
    });
  }

  return warnings;
}

export function getAuthorityDensityBridge(input: AuthorityDensityBridgeInput): AuthorityDensityBridge {
  const canonicalProblemSlug = normalizeAuthorityProblemSlug(input.problemSlug);
  const canonicalSurfaceSlug = input.surfaceSlug ? normalizeAuthoritySurfaceSlug(input.surfaceSlug) : null;

  const problemScience = canonicalProblemSlug
    ? getAuthorityProblemScienceProfile(canonicalProblemSlug) ?? null
    : null;
  const surfaceScience = canonicalSurfaceSlug ? getSurfaceScienceProfile(canonicalSurfaceSlug) : null;
  const workflowProfiles = canonicalProblemSlug
    ? getBridgeWorkflowProfiles(canonicalProblemSlug, canonicalSurfaceSlug ?? undefined)
    : [];
  const visualProfiles = canonicalProblemSlug
    ? getBridgeVisualProfiles(canonicalProblemSlug, canonicalSurfaceSlug ?? undefined)
    : [];
  const compatibilityWarnings = buildCompatibilityWarnings({
    requestedProblemSlug: input.problemSlug,
    canonicalProblemSlug,
    requestedSurfaceSlug: input.surfaceSlug,
    canonicalSurfaceSlug,
    surfaceSciencePresent: Boolean(surfaceScience),
    problemSciencePresent: Boolean(problemScience),
    workflowProfiles,
    visualProfiles,
  });

  return {
    problemSlug: input.problemSlug,
    canonicalProblemSlug,
    surfaceSlug: input.surfaceSlug ?? null,
    canonicalSurfaceSlug,
    surfaceScience,
    problemScience,
    workflowProfiles,
    visualProfiles,
    normalizedSeverity: normalizeAuthorityDensitySeverity({
      surfaceScience,
      problemScience,
      visualProfiles,
    }),
    normalizedConfidence: normalizeAuthorityDensityConfidence({
      problemConfidence: problemScience?.confidence ?? null,
      visualProfiles,
      surfaceSciencePresent: Boolean(surfaceScience),
    }),
    normalizedEscalation: normalizeAuthorityDensityEscalation({
      problemEscalation: problemScience?.escalationType ?? [],
      surfaceScience,
      workflowProfiles,
      visualProfiles,
      missingScience: !problemScience || (Boolean(input.surfaceSlug) && !surfaceScience),
    }),
    compatibilityWarnings,
    recommendedWorkflowStages: getRecommendedWorkflowStages(workflowProfiles, visualProfiles),
  };
}
