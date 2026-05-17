import {
  resolveWorkflowEngineExecutionMode,
  WORKFLOW_EXECUTION_MODE,
} from "../src/modules/workflow/workflow-execution-modes";

describe("resolveWorkflowEngineExecutionMode", () => {
  const prev = process.env.WORKFLOW_ENGINE_EXECUTION_MODE;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.WORKFLOW_ENGINE_EXECUTION_MODE;
    } else {
      process.env.WORKFLOW_ENGINE_EXECUTION_MODE = prev;
    }
  });

  it("defaults to observe_only when unset", () => {
    delete process.env.WORKFLOW_ENGINE_EXECUTION_MODE;
    expect(resolveWorkflowEngineExecutionMode()).toBe(
      WORKFLOW_EXECUTION_MODE.OBSERVE_ONLY,
    );
  });

  it("parses execution_disabled", () => {
    process.env.WORKFLOW_ENGINE_EXECUTION_MODE = "execution_disabled";
    expect(resolveWorkflowEngineExecutionMode()).toBe(
      WORKFLOW_EXECUTION_MODE.EXECUTION_DISABLED,
    );
  });
});
