-- CreateTable
CREATE TABLE "DeepCleanEstimatorMonitoringAlertOrchestrationPolicy" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "severity" TEXT,
    "escalationLevel" TEXT,
    "recommendedAction" TEXT,
    "maxAlertAgeHours" INTEGER,
    "minPriorityScore" INTEGER,
    "routeToUserId" TEXT,
    "routeToRole" TEXT,
    "allowAutoResolve" BOOLEAN NOT NULL DEFAULT false,
    "allowAutoAssign" BOOLEAN NOT NULL DEFAULT false,
    "suppressRepeatedFailures" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeepCleanEstimatorMonitoringAlertOrchestrationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringAlertOrchestrationPolicy_isEnabled_severity_escalationLevel_idx" ON "DeepCleanEstimatorMonitoringAlertOrchestrationPolicy"("isEnabled", "severity", "escalationLevel");

-- CreateTable
CREATE TABLE "DeepCleanEstimatorMonitoringAlertSuppression" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "suppressedUntil" TIMESTAMP(3),
    "reason" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeepCleanEstimatorMonitoringAlertSuppression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeepCleanEstimatorMonitoringAlertSuppression_alertId_key" ON "DeepCleanEstimatorMonitoringAlertSuppression"("alertId");

-- AddForeignKey
ALTER TABLE "DeepCleanEstimatorMonitoringAlertSuppression" ADD CONSTRAINT "DeepCleanEstimatorMonitoringAlertSuppression_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "DeepCleanEstimatorMonitoringAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DeepCleanEstimatorMonitoringAlertOrchestrationAudit" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "requestedByUserId" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeepCleanEstimatorMonitoringAlertOrchestrationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringAlertOrchestrationAudit_alertId_createdAt_idx" ON "DeepCleanEstimatorMonitoringAlertOrchestrationAudit"("alertId", "createdAt");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringAlertOrchestrationAudit_action_createdAt_idx" ON "DeepCleanEstimatorMonitoringAlertOrchestrationAudit"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "DeepCleanEstimatorMonitoringAlertOrchestrationAudit" ADD CONSTRAINT "DeepCleanEstimatorMonitoringAlertOrchestrationAudit_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "DeepCleanEstimatorMonitoringAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
