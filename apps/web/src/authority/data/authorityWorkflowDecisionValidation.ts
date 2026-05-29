import { getGuidePageBySlug } from "@/authority/data/authorityGuidePageData";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import type { AuthorityWorkflowDecisionProfile } from "@/authority/types/authorityWorkflowTypes";

const CHECKLIST_ONLY_PATTERN = /^\s*(?:\d+[.)]\s*|[-*]\s+)/;

function assertNonEmptyString(value: string, label: string): void {
  if (!value.trim()) {
    throw new Error(`Workflow decision profile missing ${label}`);
  }
}

function assertNonEmptyArray<T>(value: T[], label: string, slug: string): void {
  if (value.length === 0) {
    throw new Error(`Workflow decision profile ${slug} must include ${label}`);
  }
}

function assertNarrative(value: string, label: string, slug: string): void {
  assertNonEmptyString(value, `${slug}.${label}`);
  if (CHECKLIST_ONLY_PATTERN.test(value)) {
    throw new Error(`Workflow decision profile ${slug}.${label} is checklist-only content`);
  }
}

function assertKnownSlugs(
  slugs: string[],
  label: string,
  profileSlug: string,
  exists: (slug: string) => unknown,
): void {
  for (const slug of slugs) {
    if (!exists(slug)) {
      throw new Error(`Workflow decision profile ${profileSlug} references unknown ${label}: ${slug}`);
    }
  }
}

export function validateWorkflowDecisionProfilesOrThrow(
  profiles: AuthorityWorkflowDecisionProfile[],
): void {
  const seen = new Set<string>();

  for (const profile of profiles) {
    assertNarrative(profile.slug, "slug", profile.slug);
    assertNarrative(profile.title, "title", profile.slug);
    assertNarrative(profile.summary, "summary", profile.slug);
    assertNarrative(profile.intent, "intent", profile.slug);

    if (seen.has(profile.slug)) {
      throw new Error(`Duplicate workflow decision profile slug: ${profile.slug}`);
    }
    seen.add(profile.slug);

    assertNonEmptyArray(profile.bestForProblemSlugs, "bestForProblemSlugs", profile.slug);
    assertNonEmptyArray(profile.compatibleSurfaceSlugs, "compatibleSurfaceSlugs", profile.slug);
    assertNonEmptyArray(profile.supportingMethodSlugs, "supportingMethodSlugs", profile.slug);
    assertNonEmptyArray(profile.requiredToolRoles, "requiredToolRoles", profile.slug);
    assertNonEmptyArray(profile.sequenceLogic, "sequenceLogic", profile.slug);
    assertNonEmptyArray(profile.failureAnalysis, "failureAnalysis", profile.slug);
    assertNonEmptyArray(profile.escalationLogic, "escalationLogic", profile.slug);
    assertNonEmptyArray(profile.safetyLogic, "safetyLogic", profile.slug);
    assertNonEmptyArray(profile.cadenceLogic, "cadenceLogic", profile.slug);
    assertNonEmptyArray(profile.relatedGuides, "relatedGuides", profile.slug);
    assertNonEmptyArray(profile.antiPatternSlugs, "antiPatternSlugs", profile.slug);

    assertKnownSlugs(profile.bestForProblemSlugs, "problem slug", profile.slug, getProblemPageBySlug);
    assertKnownSlugs(profile.compatibleSurfaceSlugs, "surface slug", profile.slug, getSurfacePageBySlug);
    assertKnownSlugs(profile.supportingMethodSlugs, "method slug", profile.slug, getMethodPageBySlug);
    assertKnownSlugs(profile.relatedGuides, "guide slug", profile.slug, getGuidePageBySlug);
    assertKnownSlugs(profile.antiPatternSlugs, "anti-pattern guide slug", profile.slug, getGuidePageBySlug);

    assertNarrative(profile.chemicalLogic.chemistryClass, "chemicalLogic.chemistryClass", profile.slug);
    assertNarrative(profile.chemicalLogic.soilFit, "chemicalLogic.soilFit", profile.slug);
    assertNarrative(profile.chemicalLogic.dwellLogic, "chemicalLogic.dwellLogic", profile.slug);
    assertNarrative(profile.chemicalLogic.residueRecovery, "chemicalLogic.residueRecovery", profile.slug);

    for (const [index, role] of profile.requiredToolRoles.entries()) {
      assertNarrative(role.role, `requiredToolRoles.${index}.role`, profile.slug);
      assertNarrative(role.logic, `requiredToolRoles.${index}.logic`, profile.slug);
    }

    for (const [index, phase] of profile.sequenceLogic.entries()) {
      assertNarrative(phase.phase, `sequenceLogic.${index}.phase`, profile.slug);
      assertNarrative(phase.reason, `sequenceLogic.${index}.reason`, profile.slug);
      if (phase.dependsOn) assertNarrative(phase.dependsOn, `sequenceLogic.${index}.dependsOn`, profile.slug);
    }

    for (const [index, failure] of profile.failureAnalysis.entries()) {
      assertNarrative(failure.signal, `failureAnalysis.${index}.signal`, profile.slug);
      assertNarrative(failure.likelyCause, `failureAnalysis.${index}.likelyCause`, profile.slug);
      assertNarrative(failure.diagnosticResponse, `failureAnalysis.${index}.diagnosticResponse`, profile.slug);
    }

    for (const [index, escalation] of profile.escalationLogic.entries()) {
      assertNarrative(escalation.trigger, `escalationLogic.${index}.trigger`, profile.slug);
      assertNarrative(escalation.reason, `escalationLogic.${index}.reason`, profile.slug);
    }

    for (const [index, safety] of profile.safetyLogic.entries()) {
      assertNarrative(safety.rule, `safetyLogic.${index}.rule`, profile.slug);
      assertNarrative(safety.reason, `safetyLogic.${index}.reason`, profile.slug);
    }

    for (const [index, cadence] of profile.cadenceLogic.entries()) {
      assertNarrative(cadence.cadence, `cadenceLogic.${index}.cadence`, profile.slug);
      assertNarrative(cadence.reason, `cadenceLogic.${index}.reason`, profile.slug);
    }
  }
}
