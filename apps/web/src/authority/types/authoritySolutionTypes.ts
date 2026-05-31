import type { AuthorityWorkflowFamily } from "@/authority/types/authorityWorkflowTypes";

export type AuthoritySolutionToolRole = "required" | "recommended" | "optional" | "professional_only";

export type AuthoritySolutionChemicalRole =
  | "starter"
  | "targeted"
  | "maintenance"
  | "professional_only"
  | "do_not_use";

export type AuthoritySolutionProductRole =
  | "best_option"
  | "alternative"
  | "maintenance"
  | "professional_only"
  | "do_not_use";

export type AuthoritySolutionServiceEscalationLevel =
  | "none"
  | "book_service"
  | "get_estimate"
  | "professional_recommended"
  | "stop_and_assess";

export type AuthoritySolutionSource = "workflow" | "method" | "problem" | "surface" | "product";

export type AuthoritySolutionWorkflow = {
  primaryWorkflowSlug: string | null;
  family: AuthorityWorkflowFamily | null;
  actionSequence: string[];
  safetyRules: string[];
  escalationTriggers: string[];
};

export type AuthoritySolutionTool = {
  name: string;
  role: AuthoritySolutionToolRole;
  reason: string;
  source: AuthoritySolutionSource;
};

export type AuthoritySolutionChemical = {
  name: string;
  role: AuthoritySolutionChemicalRole;
  reason: string;
  source: AuthoritySolutionSource;
};

export type AuthoritySolutionProduct = {
  slug: string;
  title: string;
  role: AuthoritySolutionProductRole;
  reason: string;
  purchaseHref: string | null;
};

export type AuthoritySolutionServiceEscalation = {
  level: AuthoritySolutionServiceEscalationLevel;
  reasons: string[];
  primaryCta: "none" | "book_service" | "get_estimate";
};

export type AuthoritySolutionWarnings = {
  stopConditions: string[];
  doNotUse: string[];
  compatibilityNotes: string[];
};

export type AuthoritySolutionProfile = {
  problemSlug: string;
  surfaceSlug: string;
  workflow: AuthoritySolutionWorkflow;
  tools: AuthoritySolutionTool[];
  chemicals: AuthoritySolutionChemical[];
  products: AuthoritySolutionProduct[];
  serviceEscalation: AuthoritySolutionServiceEscalation;
  warnings: AuthoritySolutionWarnings;
};
