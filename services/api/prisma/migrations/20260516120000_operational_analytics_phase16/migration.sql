-- Phase 16: operational analytics warehouse foundations (additive; observe/aggregate only).

CREATE TABLE "OperationalAnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "analyticsEngineVersion" TEXT NOT NULL DEFAULT 'operational_analytics_phase16_v1',
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "metricCategory" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "metricValue" INTEGER NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalAnalyticsSnapshot_aggregateType_aggregateId_metricCategory_idx"
ON "OperationalAnalyticsSnapshot"("aggregateType", "aggregateId", "metricCategory");

CREATE INDEX "OperationalAnalyticsSnapshot_analyticsEngineVersion_aggregateWindow_createdAt_idx"
ON "OperationalAnalyticsSnapshot"("analyticsEngineVersion", "aggregateWindow", "createdAt");

CREATE TABLE "WorkflowAnalyticsAggregate" (
    "id" TEXT NOT NULL,
    "analyticsEngineVersion" TEXT NOT NULL DEFAULT 'operational_analytics_phase16_v1',
    "workflowType" TEXT NOT NULL,
    "orchestrationCategory" TEXT NOT NULL,
    "aggregateWindow" TEXT NOT NULL,
    "countsJson" JSONB NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowAnalyticsAggregate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowAnalyticsAggregate_engine_window_type_idx"
ON "WorkflowAnalyticsAggregate"("analyticsEngineVersion", "aggregateWindow", "workflowType");

CREATE INDEX "WorkflowAnalyticsAggregate_engine_window_created_idx"
ON "WorkflowAnalyticsAggregate"("analyticsEngineVersion", "aggregateWindow", "createdAt");
