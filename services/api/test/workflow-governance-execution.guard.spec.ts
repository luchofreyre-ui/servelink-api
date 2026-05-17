import { WorkflowGovernanceExecutionGuard } from "../src/modules/workflow/workflow-governance-execution.guard";
import { WORKFLOW_EXECUTION_MODE } from "../src/modules/workflow/workflow-execution-modes";
import {
  WORKFLOW_APPROVAL_STATE,
  WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE,
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
} from "../src/modules/workflow/workflow.constants";

describe("WorkflowGovernanceExecutionGuard", () => {
  const guard = new WorkflowGovernanceExecutionGuard();

  it("blocks when execution is globally disabled", () => {
    const r = guard.evaluate({
      mode: WORKFLOW_EXECUTION_MODE.EXECUTION_DISABLED,
      stepType: WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE,
      approvalState: WORKFLOW_APPROVAL_STATE.NOT_REQUIRED,
    });
    expect(r.ok).toBe(false);
    expect(r.outcome).toBe(WORKFLOW_GOVERNANCE_OUTCOME_STEP.BLOCKED);
  });

  it("allows observe pipeline step in observe_only mode", () => {
    const r = guard.evaluate({
      mode: WORKFLOW_EXECUTION_MODE.OBSERVE_ONLY,
      stepType: WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE,
      approvalState: WORKFLOW_APPROVAL_STATE.NOT_REQUIRED,
    });
    expect(r.ok).toBe(true);
    expect(r.outcome).toBe(WORKFLOW_GOVERNANCE_OUTCOME_STEP.ALLOWED);
  });

  it("marks dry_run simulated outcome", () => {
    const r = guard.evaluate({
      mode: WORKFLOW_EXECUTION_MODE.DRY_RUN,
      stepType: WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE,
      approvalState: WORKFLOW_APPROVAL_STATE.NOT_REQUIRED,
    });
    expect(r.ok).toBe(true);
    expect(r.outcome).toBe(WORKFLOW_GOVERNANCE_OUTCOME_STEP.DRY_RUN_SIMULATED);
  });

  it("blocks unknown step capability", () => {
    const r = guard.evaluate({
      mode: WORKFLOW_EXECUTION_MODE.OBSERVE_ONLY,
      stepType: "unknown_future_step_v999",
      approvalState: WORKFLOW_APPROVAL_STATE.NOT_REQUIRED,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("unknown_step_capability");
  });
});
