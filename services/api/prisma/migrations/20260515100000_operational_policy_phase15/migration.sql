-- Phase 15: operational policy evaluations + approval escalation records (additive).

CREATE TABLE "OperationalPolicyEvaluation" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "policyEngineVersion" TEXT NOT NULL DEFAULT 'operational_policy_phase15_v1',
    "policyCategory" TEXT NOT NULL,
    "policyKey" TEXT NOT NULL,
    "evaluationResult" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalPolicyEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalPolicyEvaluation_workflowExecutionId_createdAt_idx"
ON "OperationalPolicyEvaluation"("workflowExecutionId", "createdAt");

CREATE INDEX "OperationalPolicyEvaluation_workflowExecutionId_policyEngineVersion_idx"
ON "OperationalPolicyEvaluation"("workflowExecutionId", "policyEngineVersion");

ALTER TABLE "OperationalPolicyEvaluation"
ADD CONSTRAINT "OperationalPolicyEvaluation_workflowExecutionId_fkey"
FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WorkflowApprovalEscalation" (
    "id" TEXT NOT NULL,
    "workflowApprovalId" TEXT NOT NULL,
    "escalationCategory" TEXT NOT NULL,
    "escalationState" TEXT NOT NULL DEFAULT 'open',
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "triggeredByUserId" TEXT,
    "payloadJson" JSONB,

    CONSTRAINT "WorkflowApprovalEscalation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowApprovalEscalation_workflowApprovalId_escalationState_idx"
ON "WorkflowApprovalEscalation"("workflowApprovalId", "escalationState");

ALTER TABLE "WorkflowApprovalEscalation"
ADD CONSTRAINT "WorkflowApprovalEscalation_workflowApprovalId_fkey"
FOREIGN KEY ("workflowApprovalId") REFERENCES "WorkflowApproval"("id") ON DELETE CASCADE ON UPDATE CASCADE;
