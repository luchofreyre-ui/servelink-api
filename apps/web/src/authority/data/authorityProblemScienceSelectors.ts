import {
  AUTHORITY_PROBLEM_SCIENCE_PROFILES,
  AUTHORITY_PROBLEM_SCIENCE_PROFILE_SLUGS,
} from "@/authority/data/authorityProblemScienceProfiles";
import type { AuthorityProblemSlug } from "@/authority/data/authorityTaxonomy";
import type {
  AuthorityProblemEscalationType,
  AuthorityProblemRemediationMode,
  AuthorityProblemScienceProfile,
} from "@/authority/types/authorityProblemScienceTypes";

const PROFILES_BY_SLUG = new Map<string, AuthorityProblemScienceProfile>(
  AUTHORITY_PROBLEM_SCIENCE_PROFILES.map((profile) => [profile.problemSlug, profile]),
);

function sortByProblemSlug(
  profiles: AuthorityProblemScienceProfile[],
): AuthorityProblemScienceProfile[] {
  return [...profiles].sort((a, b) => a.problemSlug.localeCompare(b.problemSlug));
}

export function getAllAuthorityProblemScienceProfiles(): AuthorityProblemScienceProfile[] {
  return sortByProblemSlug(AUTHORITY_PROBLEM_SCIENCE_PROFILES);
}

export function getAuthorityProblemScienceProfile(
  problemSlug: string,
): AuthorityProblemScienceProfile | undefined {
  return PROFILES_BY_SLUG.get(problemSlug);
}

export function authorityProblemScienceProfileExists(problemSlug: string): boolean {
  return PROFILES_BY_SLUG.has(problemSlug);
}

export function getAuthorityProblemScienceProfileSlugs(): AuthorityProblemSlug[] {
  return [...AUTHORITY_PROBLEM_SCIENCE_PROFILE_SLUGS].sort((a, b) => a.localeCompare(b));
}

export function getAuthorityProblemScienceProfilesByEscalationType(
  escalationType: AuthorityProblemEscalationType,
): AuthorityProblemScienceProfile[] {
  return sortByProblemSlug(
    AUTHORITY_PROBLEM_SCIENCE_PROFILES.filter((profile) =>
      profile.escalationType.includes(escalationType),
    ),
  );
}

export function getAuthorityProblemScienceProfilesByRemediationMode(
  remediationMode: AuthorityProblemRemediationMode,
): AuthorityProblemScienceProfile[] {
  return sortByProblemSlug(
    AUTHORITY_PROBLEM_SCIENCE_PROFILES.filter((profile) =>
      profile.remediationMode.includes(remediationMode),
    ),
  );
}
