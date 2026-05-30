import type { AuthorityProblemSlug, AuthoritySurfaceSlug } from "@/authority/data/authorityTaxonomy";
import type { AuthorityProblemEscalationType, AuthorityProblemScienceConfidence, AuthorityProblemScienceProfile } from "@/authority/types/authorityProblemScienceTypes";
import type { AuthoritySurfaceScienceProfile } from "@/authority/types/authoritySurfaceScienceTypes";
import type { AuthorityWorkflowDecisionProfile } from "@/authority/types/authorityWorkflowTypes";
import type { VisualDiagnosticProfile, WorkflowStage } from "@/lib/visual-authority/visualAuthorityTypes";

export type AuthorityDensitySeverity = "none" | "low" | "moderate" | "high" | "critical";

export type AuthorityDensityConfidence = AuthorityProblemScienceConfidence;

export type AuthorityDensityEscalation =
  | AuthorityProblemEscalationType
  | "restoration_boundary"
  | "visual_stop"
  | "workflow_safety"
  | "missing_science_profile";

export type AuthorityDensityCompatibilityWarning = {
  source: "surface" | "problem" | "workflow" | "visual";
  message: string;
};

export type AuthorityDensityBridgeInput = {
  problemSlug: string;
  surfaceSlug?: string;
};

export type AuthorityDensityBridge = {
  problemSlug: string;
  canonicalProblemSlug: AuthorityProblemSlug | null;
  surfaceSlug: string | null;
  canonicalSurfaceSlug: AuthoritySurfaceSlug | null;
  surfaceScience: AuthoritySurfaceScienceProfile | null;
  problemScience: AuthorityProblemScienceProfile | null;
  workflowProfiles: AuthorityWorkflowDecisionProfile[];
  visualProfiles: VisualDiagnosticProfile[];
  normalizedSeverity: AuthorityDensitySeverity;
  normalizedConfidence: AuthorityDensityConfidence;
  normalizedEscalation: AuthorityDensityEscalation[];
  compatibilityWarnings: AuthorityDensityCompatibilityWarning[];
  recommendedWorkflowStages: WorkflowStage[];
};
