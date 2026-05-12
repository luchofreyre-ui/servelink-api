/**
 * Phase 16 — Operational Analytics Governance V1 (code-local contract).
 *
 * These rules define deterministic, auditable analytics boundaries — not enforced by runtime guards beyond human process.
 */

import { ANALYTICS_POLICY_ENGINE_VERSION_REF } from "./operational-analytics.constants";
import { OPERATIONAL_POLICY_ENGINE_VERSION } from "../workflow/operational-policy.constants";

export const OPERATIONAL_ANALYTICS_GOVERNANCE_VERSION =
  "operational_analytics_governance_v1" as const;

/** Uses disallowed for product, compliance, and safety posture (documentation + reviews). */
export const PROHIBITED_ANALYTICS_USES = [
  "Autonomous dispatch or assignment optimization driven solely by analytics aggregates.",
  "Autonomous billing, capture, or payout execution triggered from analytics thresholds.",
  "Customer-visible pricing or quote changes computed without explicit governed product flows.",
  "Self-modifying policy or governance rules based on metric drift.",
  "ML-based predictive ranking of franchise owners, customers, or bookings for automatic action.",
  "Mass automated workflow approvals or transition invokes initiated from dashboards.",
] as const;

export const ANALYTICS_EXPLAINABILITY_RULES = [
  "Every surfaced aggregate must map to a countable source query or snapshot row with stable metric keys.",
  "Historical snapshots are point-in-time; live counts may diverge until the next explicit refresh.",
  "Severity and posture semantics remain aligned with workflow policy engine versions where referenced.",
  "No numeric score shall imply legal, credit, or safety verdict — only operational observability.",
] as const;

export function assertPolicyAnalyticsVersionAlignment(): {
  aligned: boolean;
  analyticsRefsPolicy: string;
  activePolicyEngine: string;
} {
  return {
    aligned: ANALYTICS_POLICY_ENGINE_VERSION_REF === OPERATIONAL_POLICY_ENGINE_VERSION,
    analyticsRefsPolicy: ANALYTICS_POLICY_ENGINE_VERSION_REF,
    activePolicyEngine: OPERATIONAL_POLICY_ENGINE_VERSION,
  };
}
