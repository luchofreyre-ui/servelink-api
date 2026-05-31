import type { AuthorityDensityBridge, AuthorityDensityEscalation } from "@/authority/types/authorityDensityTypes";
import type { AuthorityRelationshipDisposition } from "@/authority/types/authorityGraphTypes";
import type {
  AuthoritySolutionProductRole,
  AuthoritySolutionServiceEscalation,
} from "@/authority/types/authoritySolutionTypes";

const STOP_ESCALATIONS = new Set<AuthorityDensityEscalation>([
  "permanent_finish_change",
  "restoration_boundary",
]);

const PROFESSIONAL_ESCALATIONS = new Set<AuthorityDensityEscalation>([
  "chemical_damage",
  "health_or_biological",
  "moisture_source",
  "visual_stop",
  "workflow_safety",
]);

const ESTIMATE_ESCALATIONS = new Set<AuthorityDensityEscalation>([
  "commercial_or_turnover",
  "unknown_material",
  "surface_risk",
]);

export function roleForRecommendedProduct(args: {
  slug: string;
  bestOverall?: string;
  bestForHeavy?: string;
  bestForMaintenance?: string;
  professional?: string;
}): AuthoritySolutionProductRole {
  if (args.slug === args.bestOverall) return "best_option";
  if (args.slug === args.bestForHeavy) return "alternative";
  if (args.slug === args.bestForMaintenance) return "maintenance";
  if (args.slug === args.professional) return "professional_only";
  return "alternative";
}

export function resolveAuthoritySolutionServiceEscalation(args: {
  bridge: AuthorityDensityBridge;
  graphDisposition?: AuthorityRelationshipDisposition | null;
}): AuthoritySolutionServiceEscalation {
  const reasons: string[] = [];
  const escalations = args.bridge.normalizedEscalation;

  if (args.graphDisposition === "avoid") {
    reasons.push("This surface/problem relationship is marked avoid in the authority graph.");
  }
  if (args.bridge.normalizedSeverity === "critical") {
    reasons.push("The normalized severity indicates likely damage, embedding, or restoration-level risk.");
  }
  for (const escalation of escalations) {
    if (STOP_ESCALATIONS.has(escalation)) {
      reasons.push("The surface or problem crosses a restoration boundary.");
      break;
    }
  }

  if (reasons.length > 0) {
    return {
      level: "stop_and_assess",
      reasons,
      primaryCta: "get_estimate",
    };
  }

  const professionalReasons: string[] = [];
  for (const escalation of escalations) {
    if (PROFESSIONAL_ESCALATIONS.has(escalation)) {
      professionalReasons.push("Workflow or visual diagnostics recommend professional judgment before escalation.");
      break;
    }
  }
  if (professionalReasons.length > 0) {
    return {
      level: "professional_recommended",
      reasons: professionalReasons,
      primaryCta: "get_estimate",
    };
  }

  const estimateReasons: string[] = [];
  if (args.bridge.normalizedSeverity === "high") {
    estimateReasons.push("The problem is high severity for this surface.");
  }
  for (const escalation of escalations) {
    if (ESTIMATE_ESCALATIONS.has(escalation)) {
      estimateReasons.push("The surface or context needs a controlled inspection before stronger chemistry.");
      break;
    }
  }
  if (estimateReasons.length > 0 || args.graphDisposition === "caution") {
    return {
      level: "get_estimate",
      reasons: estimateReasons.length ? estimateReasons : ["The graph relationship is marked caution."],
      primaryCta: "get_estimate",
    };
  }

  if (args.graphDisposition === "preferred" || args.graphDisposition === "compatible") {
    return {
      level: "book_service",
      reasons: ["This is a known authority graph pairing with a bounded cleaning workflow."],
      primaryCta: "book_service",
    };
  }

  return {
    level: "none",
    reasons: [],
    primaryCta: "none",
  };
}
