import {
  OPERATIONAL_POLICY_ENGINE_VERSION,
  POLICY_CATEGORY,
  POLICY_EVALUATION_RESULT,
  POLICY_KEY,
  POLICY_SEVERITY,
} from "./operational-policy.constants";
import {
  WORKFLOW_APPROVAL_RECORD_STATE,
  WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1,
  WORKFLOW_EXECUTION_STAGE,
  WORKFLOW_EXECUTION_STATE,
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
  WORKFLOW_STEP_STATE,
} from "./workflow.constants";
import { WORKFLOW_EXECUTION_MODE } from "./workflow-execution-modes";

export type PolicyEvaluationDraft = {
  policyCategory: string;
  policyKey: string;
  evaluationResult: string;
  severity: string;
  explanation: string;
  payloadJson?: Record<string, unknown>;
};

type LoadedExecution = {
  id: string;
  state: string;
  executionStage: string;
  executionMode: string;
  approvalState: string | null;
  failureReason: string | null;
  steps: Array<{
    state: string;
    governanceOutcome: string | null;
    failedAt: Date | null;
  }>;
  approvals: Array<{
    approvalType: string;
    approvalState: string;
    expiresAt: Date | null;
    requestedAt: Date;
    metadataJson: unknown | null;
  }>;
};

const TTL_PRESSURE_MS = 24 * 3600_000;

function hasFailedNonGovernanceStep(ex: LoadedExecution): boolean {
  return ex.steps.some(
    (s) =>
      s.state === WORKFLOW_STEP_STATE.FAILED &&
      s.governanceOutcome !== WORKFLOW_GOVERNANCE_OUTCOME_STEP.BLOCKED,
  );
}

/**
 * Pure deterministic rule pack — safe for audit replay and future AI proposal scaffolding.
 */
export function evaluateOperationalPoliciesForExecution(
  ex: LoadedExecution,
): PolicyEvaluationDraft[] {
  const out: PolicyEvaluationDraft[] = [];

  if (ex.state === WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL) {
    out.push({
      policyCategory: POLICY_CATEGORY.WORKFLOW_POSTURE,
      policyKey: POLICY_KEY.WORKFLOW_WAITING_APPROVAL,
      evaluationResult: POLICY_EVALUATION_RESULT.ATTENTION,
      severity: POLICY_SEVERITY.MEDIUM,
      explanation:
        "Workflow engine is paused at a human approval checkpoint — progression requires explicit operator decision (no autonomous resume).",
      payloadJson: {
        workflowExecutionId: ex.id,
        policyEngineVersion: OPERATIONAL_POLICY_ENGINE_VERSION,
      },
    });
  }

  if (
    ex.state === WORKFLOW_EXECUTION_STATE.FAILED &&
    ex.executionStage === WORKFLOW_EXECUTION_STAGE.GOVERNANCE_BLOCKED
  ) {
    out.push({
      policyCategory: POLICY_CATEGORY.GOVERNANCE,
      policyKey: POLICY_KEY.WORKFLOW_GOVERNANCE_BLOCKED,
      evaluationResult: POLICY_EVALUATION_RESULT.BLOCKED_SIGNAL,
      severity: POLICY_SEVERITY.HIGH,
      explanation:
        "Governance rails refused a governed step — inspect workflow step outcomes before proposing operational automation.",
      payloadJson: {
        workflowExecutionId: ex.id,
        failureReason: ex.failureReason,
      },
    });
  }

  if (
    ex.state === WORKFLOW_EXECUTION_STATE.FAILED &&
    ex.executionStage !== WORKFLOW_EXECUTION_STAGE.GOVERNANCE_BLOCKED &&
    hasFailedNonGovernanceStep(ex)
  ) {
    out.push({
      policyCategory: POLICY_CATEGORY.WORKFLOW_POSTURE,
      policyKey: POLICY_KEY.WORKFLOW_STEP_FAILURE,
      evaluationResult: POLICY_EVALUATION_RESULT.ATTENTION,
      severity: POLICY_SEVERITY.HIGH,
      explanation:
        "A workflow step failed outside governance-block classification — verify runner stability and operational replay hygiene.",
      payloadJson: { workflowExecutionId: ex.id },
    });
  }

  if (ex.state === WORKFLOW_EXECUTION_STATE.COMPLETED) {
    out.push({
      policyCategory: POLICY_CATEGORY.WORKFLOW_POSTURE,
      policyKey: POLICY_KEY.WORKFLOW_COMPLETED_OBSERVE,
      evaluationResult: POLICY_EVALUATION_RESULT.PASS,
      severity: POLICY_SEVERITY.NONE,
      explanation:
        "Observe workflow completed — audit trail persisted without autonomous booking mutations from policy layer.",
      payloadJson: { workflowExecutionId: ex.id },
    });
  }

  if (ex.executionMode === WORKFLOW_EXECUTION_MODE.APPROVAL_REQUIRED) {
    out.push({
      policyCategory: POLICY_CATEGORY.GOVERNANCE,
      policyKey: POLICY_KEY.EXECUTION_MODE_APPROVAL_REQUIRED_ACTIVE,
      evaluationResult: POLICY_EVALUATION_RESULT.INFO,
      severity: POLICY_SEVERITY.LOW,
      explanation:
        "Execution mode stamps approval_required — governed checkpoints must remain operator-mediated.",
      payloadJson: {
        workflowExecutionId: ex.id,
        executionMode: ex.executionMode,
      },
    });
  }

  const now = Date.now();
  for (const ap of ex.approvals) {
    if (ap.approvalState !== WORKFLOW_APPROVAL_RECORD_STATE.PENDING) continue;

    if (ap.expiresAt) {
      const msLeft = ap.expiresAt.getTime() - now;
      if (msLeft <= TTL_PRESSURE_MS) {
        out.push({
          policyCategory: POLICY_CATEGORY.APPROVAL_HYGIENE,
          policyKey: POLICY_KEY.APPROVAL_PENDING_TTL_PRESSURE,
          evaluationResult: POLICY_EVALUATION_RESULT.ATTENTION,
          severity: msLeft <= 0 ? POLICY_SEVERITY.HIGH : POLICY_SEVERITY.MEDIUM,
          explanation:
            msLeft <= 0
              ? "Pending approval appears expired — operators should deny or refresh governed proposals explicitly."
              : "Pending approval approaches expiry — prioritize operator review to avoid stale orchestration proposals.",
          payloadJson: {
            workflowExecutionId: ex.id,
            approvalType: ap.approvalType,
            expiresAt: ap.expiresAt.toISOString(),
          },
        });
      }
    }
  }

  for (const ap of ex.approvals) {
    if (
      ap.approvalType === WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1 &&
      ap.approvalState === WORKFLOW_APPROVAL_RECORD_STATE.APPROVED
    ) {
      const meta = (ap.metadataJson ?? {}) as {
        bookingTransitionInvokedAt?: string;
      };
      if (!meta.bookingTransitionInvokedAt) {
        out.push({
          policyCategory: POLICY_CATEGORY.APPROVAL_HYGIENE,
          policyKey: POLICY_KEY.APPROVAL_BOOKING_INVOKE_STALE,
          evaluationResult: POLICY_EVALUATION_RESULT.INFO,
          severity: POLICY_SEVERITY.LOW,
          explanation:
            "Approved booking-transition invoke exists without recorded invocation metadata — explicit admin invoke path still governs execution.",
          payloadJson: { workflowExecutionId: ex.id },
        });
      }
    }
  }

  return out;
}
