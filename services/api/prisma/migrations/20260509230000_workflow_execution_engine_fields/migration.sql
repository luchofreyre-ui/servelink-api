-- Phase 12: execution engine observability + mode fields (additive).

ALTER TABLE "WorkflowExecution" ADD COLUMN "executionMode" TEXT NOT NULL DEFAULT 'observe_only',
ADD COLUMN "approvalState" TEXT;

ALTER TABLE "WorkflowExecutionStep" ADD COLUMN "runnerKey" TEXT,
ADD COLUMN "governanceOutcome" TEXT;
