import { AUTHORITY_WORKFLOW_DECISION_PROFILES } from "@/authority/data/authorityWorkflowDecisionProfiles";
import type { AuthorityWorkflowDecisionProfile } from "@/authority/types/authorityWorkflowTypes";

function sortProfiles(
  profiles: AuthorityWorkflowDecisionProfile[],
): AuthorityWorkflowDecisionProfile[] {
  return [...profiles].sort((a, b) => a.title.localeCompare(b.title));
}

export function getAllWorkflowDecisionProfiles(): AuthorityWorkflowDecisionProfile[] {
  return AUTHORITY_WORKFLOW_DECISION_PROFILES;
}

export function getAllWorkflowDecisionSlugs(): string[] {
  return AUTHORITY_WORKFLOW_DECISION_PROFILES.map((profile) => profile.slug);
}

export function getWorkflowDecisionProfileBySlug(
  slug: string,
): AuthorityWorkflowDecisionProfile | undefined {
  return AUTHORITY_WORKFLOW_DECISION_PROFILES.find((profile) => profile.slug === slug);
}

export function workflowDecisionProfileSlugExists(slug: string): boolean {
  return Boolean(getWorkflowDecisionProfileBySlug(slug));
}

export function getWorkflowDecisionProfilesForProblem(
  problemSlug: string,
): AuthorityWorkflowDecisionProfile[] {
  return sortProfiles(
    AUTHORITY_WORKFLOW_DECISION_PROFILES.filter((profile) =>
      profile.bestForProblemSlugs.includes(problemSlug),
    ),
  );
}

export function getWorkflowDecisionProfilesForSurface(
  surfaceSlug: string,
): AuthorityWorkflowDecisionProfile[] {
  return sortProfiles(
    AUTHORITY_WORKFLOW_DECISION_PROFILES.filter((profile) =>
      profile.compatibleSurfaceSlugs.includes(surfaceSlug),
    ),
  );
}

export function getWorkflowDecisionProfilesForMethod(
  methodSlug: string,
): AuthorityWorkflowDecisionProfile[] {
  return sortProfiles(
    AUTHORITY_WORKFLOW_DECISION_PROFILES.filter((profile) =>
      profile.supportingMethodSlugs.includes(methodSlug),
    ),
  );
}

export function getWorkflowDecisionProfilesForGuide(
  guideSlug: string,
): AuthorityWorkflowDecisionProfile[] {
  return sortProfiles(
    AUTHORITY_WORKFLOW_DECISION_PROFILES.filter((profile) =>
      profile.relatedGuides.includes(guideSlug) || profile.antiPatternSlugs.includes(guideSlug),
    ),
  );
}
