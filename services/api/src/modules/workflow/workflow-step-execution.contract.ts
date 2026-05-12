import type { WorkflowExecutionMode } from "./workflow-execution-modes";

export type WorkflowStepRunContext = {
  executionId: string;
  stepId: string;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  executionPayloadJson: unknown;
  stepPayloadJson: unknown | null;
  executionMode: WorkflowExecutionMode;
  dryRun: boolean;
};

export type WorkflowStepRunResult = {
  success: boolean;
  resultJson: Record<string, unknown>;
  governanceOutcome: string;
};

export interface WorkflowStepRunner {
  readonly runnerKey: string;
  readonly stepType: string;
  readonly stepVersion: number;
  run(ctx: WorkflowStepRunContext): Promise<WorkflowStepRunResult>;
}
