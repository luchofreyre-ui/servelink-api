-- Phase 22 — portfolio balancing + congestion snapshots (additive; observe/explain only; no autonomous optimization).

CREATE TABLE "OperationalBalancingSnapshot" (
    "id" TEXT NOT NULL,
    "balancingEngineVersion" TEXT NOT NULL DEFAULT 'operational_balancing_phase22_v1',
    "balancingCategory" TEXT NOT NULL,
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "severity" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalBalancingSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalBalancingSnapshot_balancingEngineVersion_aggregateWindow_createdAt_idx"
ON "OperationalBalancingSnapshot"("balancingEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalBalancingSnapshot_balancingCategory_severity_createdAt_idx"
ON "OperationalBalancingSnapshot"("balancingCategory", "severity", "createdAt");

CREATE TABLE "WorkflowCongestionSnapshot" (
    "id" TEXT NOT NULL,
    "congestionEngineVersion" TEXT NOT NULL DEFAULT 'workflow_congestion_phase22_v1',
    "workflowType" TEXT NOT NULL,
    "congestionCategory" TEXT NOT NULL,
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "severity" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowCongestionSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowCongestionSnapshot_congestionEngineVersion_aggregateWindow_createdAt_idx"
ON "WorkflowCongestionSnapshot"("congestionEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "WorkflowCongestionSnapshot_workflowType_congestionCategory_idx"
ON "WorkflowCongestionSnapshot"("workflowType", "congestionCategory");
