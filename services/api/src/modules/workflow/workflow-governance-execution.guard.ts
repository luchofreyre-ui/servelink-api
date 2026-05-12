import type { WorkflowExecutionMode } from "./workflow-execution-modes";
import { WORKFLOW_EXECUTION_MODE } from "./workflow-execution-modes";
import {
  HUMAN_APPROVAL_REQUIRED_WORKFLOW_CATEGORIES,
  OBSERVE_ONLY_WORKFLOW_CATEGORIES,
} from "./workflow-governance";
import { capabilityCategoryForStep } from "./workflow-capability-matrix";
import {
  WORKFLOW_APPROVAL_STATE,
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
} from "./workflow.constants";

export type GovernanceEvaluationResult = {
  ok: boolean;
  outcome: string;
  reason?: string;
};

function requiresHumanApprovalCategory(category: string): boolean {
  return (HUMAN_APPROVAL_REQUIRED_WORKFLOW_CATEGORIES as readonly string[]).includes(
    category,
  );
}

function isObserveSafeCategory(category: string): boolean {
  return (OBSERVE_ONLY_WORKFLOW_CATEGORIES as readonly string[]).includes(category);
}

/**
 * Refuses unknown capabilities and unsafe modes — approval-aware for future gated steps.
 */
export class WorkflowGovernanceExecutionGuard {
  evaluate(params: {
    mode: WorkflowExecutionMode;
    stepType: string;
    approvalState: string | null | undefined;
  }): GovernanceEvaluationResult {
    if (params.mode === WORKFLOW_EXECUTION_MODE.EXECUTION_DISABLED) {
      return {
        ok: false,
        outcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.BLOCKED,
        reason: "execution_disabled_mode",
      };
    }

    const category = capabilityCategoryForStep(params.stepType);

    if (category === "unknown_capability") {
      return {
        ok: false,
        outcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.BLOCKED,
        reason: "unknown_step_capability",
      };
    }

    if (!isObserveSafeCategory(category)) {
      if (requiresHumanApprovalCategory(category)) {
        if (params.mode === WORKFLOW_EXECUTION_MODE.APPROVAL_REQUIRED) {
          if (params.approvalState !== WORKFLOW_APPROVAL_STATE.APPROVED) {
            return {
              ok: false,
              outcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.BLOCKED,
              reason: "approval_required_not_granted",
            };
          }
        }
      }
    }

    if (params.mode === WORKFLOW_EXECUTION_MODE.DRY_RUN) {
      return {
        ok: true,
        outcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.DRY_RUN_SIMULATED,
      };
    }

    return {
      ok: true,
      outcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.ALLOWED,
    };
  }

  /** Runner-side dry-run hint — observe runners remain non-destructive regardless. */
  isDryRunMode(mode: WorkflowExecutionMode): boolean {
    return mode === WORKFLOW_EXECUTION_MODE.DRY_RUN;
  }
}
