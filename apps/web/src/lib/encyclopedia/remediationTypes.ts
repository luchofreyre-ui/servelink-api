// remediationTypes.ts

import type { PublishFailureReason } from "./publishPolicyTypes";

export type RemediationActionType =
  | "add-evidence"
  | "strengthen-rationale"
  | "add-internal-links"
  | "expand-depth"
  | "review-high-risk-support"
  | "rewrite-title";

export type RemediationSuggestion = {
  type: RemediationActionType;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  sourceReason?: PublishFailureReason;
};

export type PageRemediationPlan = {
  slug: string;
  title: string;
  passedPolicy: boolean;
  reasons: PublishFailureReason[];
  suggestions: RemediationSuggestion[];
};
