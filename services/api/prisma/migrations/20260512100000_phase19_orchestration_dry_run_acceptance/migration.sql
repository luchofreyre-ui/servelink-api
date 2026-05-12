-- Phase 19 — orchestration dry-run previews + recommendation acceptance (additive; human-governed).

CREATE TABLE "WorkflowDryRunExecution" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "previewCategory" TEXT NOT NULL,
    "previewState" TEXT NOT NULL DEFAULT 'completed',
    "recommendationKey" TEXT,
    "idempotencyKey" TEXT,
    "requestedByUserId" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "resultJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowDryRunExecution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowDryRunExecution_idempotencyKey_key" ON "WorkflowDryRunExecution"("idempotencyKey");

CREATE INDEX "WorkflowDryRunExecution_workflowExecutionId_createdAt_idx" ON "WorkflowDryRunExecution"("workflowExecutionId", "createdAt");

CREATE INDEX "WorkflowDryRunExecution_workflowExecutionId_previewCategory_idx" ON "WorkflowDryRunExecution"("workflowExecutionId", "previewCategory");

CREATE TABLE "WorkflowRecommendationAcceptance" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "recommendationKey" TEXT NOT NULL,
    "acceptanceState" TEXT NOT NULL DEFAULT 'recorded',
    "acceptedByUserId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "workflowApprovalId" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowRecommendationAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowRecommendationAcceptance_idempotencyKey_key" ON "WorkflowRecommendationAcceptance"("idempotencyKey");

CREATE INDEX "WorkflowRecommendationAcceptance_workflowExecutionId_recommendationKey_idx" ON "WorkflowRecommendationAcceptance"("workflowExecutionId", "recommendationKey");

CREATE INDEX "WorkflowRecommendationAcceptance_workflowExecutionId_acceptanceState_idx" ON "WorkflowRecommendationAcceptance"("workflowExecutionId", "acceptanceState");

ALTER TABLE "WorkflowDryRunExecution" ADD CONSTRAINT "WorkflowDryRunExecution_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowRecommendationAcceptance" ADD CONSTRAINT "WorkflowRecommendationAcceptance_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowRecommendationAcceptance" ADD CONSTRAINT "WorkflowRecommendationAcceptance_workflowApprovalId_fkey" FOREIGN KEY ("workflowApprovalId") REFERENCES "WorkflowApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;
