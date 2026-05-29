import {
  VISUAL_DIAGNOSTIC_PROFILES,
  type VisualDiagnosticProfileSlug,
} from "./visualDiagnosticProfiles";
import type {
  VisualDiagnosticProfile,
  VisualPurpose,
  WorkflowStage,
} from "./visualAuthorityTypes";
import { validateVisualDiagnosticProfiles } from "./visualDiagnosticValidation";

export function getAllVisualDiagnosticProfiles(): readonly VisualDiagnosticProfile[] {
  return VISUAL_DIAGNOSTIC_PROFILES;
}

export function getVisualDiagnosticProfileBySlug(
  slug: string,
): VisualDiagnosticProfile | null {
  return VISUAL_DIAGNOSTIC_PROFILES.find((profile) => profile.slug === slug) ?? null;
}

export function requireVisualDiagnosticProfile(
  slug: VisualDiagnosticProfileSlug,
): VisualDiagnosticProfile {
  const profile = getVisualDiagnosticProfileBySlug(slug);
  if (!profile) {
    throw new Error(`Missing visual diagnostic profile: ${slug}`);
  }
  return profile;
}

export function getVisualDiagnosticProfilesByPurpose(
  purpose: VisualPurpose,
): readonly VisualDiagnosticProfile[] {
  return VISUAL_DIAGNOSTIC_PROFILES.filter((profile) =>
    profile.visualPurpose.includes(purpose),
  );
}

export function getVisualDiagnosticProfilesByWorkflowStage(
  stage: WorkflowStage,
): readonly VisualDiagnosticProfile[] {
  return VISUAL_DIAGNOSTIC_PROFILES.filter((profile) =>
    profile.workflowStage.includes(stage),
  );
}

export function getMisidentificationVisualDiagnosticProfiles(): readonly VisualDiagnosticProfile[] {
  return getVisualDiagnosticProfilesByPurpose("misidentification");
}

export function getInvalidVisualDiagnosticProfiles(): readonly VisualDiagnosticProfile[] {
  return VISUAL_DIAGNOSTIC_PROFILES.filter(
    (profile) => !validateVisualDiagnosticProfiles([profile]).valid,
  );
}
