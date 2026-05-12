/**
 * Governance constants — Phase 11 safety rails (documentation + runtime markers).
 * Workflow runners MUST enforce these boundaries before adding autonomous steps.
 */

export const WORKFLOW_GOVERNANCE_VERSION = "workflow_governance_v1" as const;

/** Actions workflows must never perform autonomously in Phase 11 runtime foundation. */
export const PROHIBITED_AUTONOMOUS_WORKFLOW_ACTIONS = [
  "customer_notification_without_human_review",
  "booking_status_autonomous_mutation",
  "dispatch_autonomous_assignment",
  "billing_charge_or_capture",
  "payment_refund_or_void",
  "bulk_recipient_messaging",
  "workflow_definition_self_modify",
  "ai_generated_customer_copy_send",
] as const;

/** Categories that require explicit human approval gate before any future automation step executes. */
export const HUMAN_APPROVAL_REQUIRED_WORKFLOW_CATEGORIES = [
  "billing_mutation",
  "payment_collection",
  "dispatch_assignment",
  "customer_message_send",
  "pricing_override",
  "contract_term_change",
] as const;

/** Categories permitted for observe-only / audit workflows without approval (recordkeeping only). */
export const OBSERVE_ONLY_WORKFLOW_CATEGORIES = [
  "delivery_pipeline_observation",
  "operational_audit_trace",
  "support_escalation_visibility",
  /** Gate/resume steps persist approvals + audit only — no booking/finance writes in runners. */
  "operational_governance_checkpoint",
] as const;
