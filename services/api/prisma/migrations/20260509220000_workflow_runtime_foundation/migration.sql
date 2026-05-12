-- Phase 11: durable workflow execution substrate (observe-only, additive).

CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL,
    "workflowVersion" INTEGER NOT NULL DEFAULT 1,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "triggeringOutboxEventId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "executionStage" TEXT NOT NULL DEFAULT 'initialized',
    "payloadJson" JSONB NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowExecution_triggeringOutboxEventId_key"
ON "WorkflowExecution"("triggeringOutboxEventId");

CREATE INDEX "WorkflowExecution_aggregateType_aggregateId_createdAt_idx"
ON "WorkflowExecution"("aggregateType", "aggregateId", "createdAt");

CREATE INDEX "WorkflowExecution_correlationId_idx"
ON "WorkflowExecution"("correlationId");

CREATE INDEX "WorkflowExecution_state_createdAt_idx"
ON "WorkflowExecution"("state", "createdAt");

CREATE INDEX "WorkflowExecution_workflowType_createdAt_idx"
ON "WorkflowExecution"("workflowType", "createdAt");

CREATE TABLE "WorkflowExecutionStep" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "stepVersion" INTEGER NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "payloadJson" JSONB,
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowExecutionStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowExecutionStep_workflowExecutionId_createdAt_idx"
ON "WorkflowExecutionStep"("workflowExecutionId", "createdAt");

ALTER TABLE "WorkflowExecutionStep"
ADD CONSTRAINT "WorkflowExecutionStep_workflowExecutionId_fkey"
FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
