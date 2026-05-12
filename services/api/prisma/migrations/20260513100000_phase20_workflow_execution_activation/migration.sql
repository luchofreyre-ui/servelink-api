-- Phase 20 — guided orchestration activation records (human-gated; additive).

CREATE TABLE "WorkflowExecutionActivation" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "recommendationAcceptanceId" TEXT NOT NULL,
    "activationState" TEXT NOT NULL DEFAULT 'registered',
    "activationCategory" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "invokedAt" TIMESTAMP(3),
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "resultJson" JSONB NOT NULL DEFAULT '{}',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowExecutionActivation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowExecutionActivation_idempotencyKey_key" ON "WorkflowExecutionActivation"("idempotencyKey");

CREATE INDEX "WorkflowExecutionActivation_workflowExecutionId_activationState_idx" ON "WorkflowExecutionActivation"("workflowExecutionId", "activationState");

CREATE INDEX "WorkflowExecutionActivation_recommendationAcceptanceId_activationState_idx" ON "WorkflowExecutionActivation"("recommendationAcceptanceId", "activationState");

ALTER TABLE "WorkflowExecutionActivation" ADD CONSTRAINT "WorkflowExecutionActivation_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowExecutionActivation" ADD CONSTRAINT "WorkflowExecutionActivation_recommendationAcceptanceId_fkey" FOREIGN KEY ("recommendationAcceptanceId") REFERENCES "WorkflowRecommendationAcceptance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
