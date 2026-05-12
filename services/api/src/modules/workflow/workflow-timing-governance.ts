/**
 * Phase 17 — Workflow Timing Governance V1 (code-local contract).
 */

import { OPERATIONAL_POLICY_ENGINE_VERSION } from "./operational-policy.constants";
import { WORKFLOW_TIMING_ENGINE_VERSION } from "./workflow-timing.constants";

export const WORKFLOW_TIMING_GOVERNANCE_VERSION =
  "workflow_timing_governance_v1" as const;

export const PROHIBITED_WORKFLOW_TIMER_USES = [
  "Autonomous customer booking status or lifecycle transitions triggered solely by timers.",
  "Autonomous dispatch, assignment, or payout actions initiated from wake ticks.",
  "Autonomous payment capture, refunds, or Stripe mutations scheduled via workflow timers.",
  "AI-selected wake times or ML-derived scheduling priorities.",
  "Timers that bypass WorkflowGovernanceExecutionGuard or mutate execution mode without audit.",
  "Mass automated approvals or denies driven by countdown expiry alone.",
] as const;

export const WORKFLOW_TIMING_EXPLAINABILITY_RULES = [
  "Each timer row exposes timerType, wakeAt, dedupeKey, and deterministic payload JSON for audits.",
  "Wake handlers must be idempotent — replays use timerState claims (pending → triggered).",
  "Approval expiry visibility escalates governance signals; human approval/deny remains explicit.",
  "Wait states partition operational posture from customer-visible booking semantics.",
  `Timing engine version ${WORKFLOW_TIMING_ENGINE_VERSION} pairs with policy engine ${OPERATIONAL_POLICY_ENGINE_VERSION} for cross-audit.`,
] as const;
