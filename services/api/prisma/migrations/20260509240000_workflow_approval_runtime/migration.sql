-- Phase 13: durable approvals + audit trail (additive).

CREATE TABLE "WorkflowApproval" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "approvalState" TEXT NOT NULL DEFAULT 'pending',
    "requestedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "deniedByUserId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "deniedAt" TIMESTAMP(3),
    "payloadJson" JSONB NOT NULL,
    "metadataJson" JSONB,

    CONSTRAINT "WorkflowApproval_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowApproval_workflowExecutionId_approvalState_idx"
ON "WorkflowApproval"("workflowExecutionId", "approvalState");

CREATE INDEX "WorkflowApproval_approvalState_requestedAt_idx"
ON "WorkflowApproval"("approvalState", "requestedAt");

CREATE TABLE "WorkflowApprovalAudit" (
    "id" TEXT NOT NULL,
    "workflowApprovalId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "result" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowApprovalAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowApprovalAudit_workflowApprovalId_createdAt_idx"
ON "WorkflowApprovalAudit"("workflowApprovalId", "createdAt");

ALTER TABLE "WorkflowApproval"
ADD CONSTRAINT "WorkflowApproval_workflowExecutionId_fkey"
FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowApprovalAudit"
ADD CONSTRAINT "WorkflowApprovalAudit_workflowApprovalId_fkey"
FOREIGN KEY ("workflowApprovalId") REFERENCES "WorkflowApproval"("id") ON DELETE CASCADE ON UPDATE CASCADE;
