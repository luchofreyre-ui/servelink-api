-- CreateTable
CREATE TABLE "DeepCleanEstimatorMonitoringAlertExecution" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "reason" TEXT,
    "payloadJson" JSONB,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeepCleanEstimatorMonitoringAlertExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringAlertExecution_alertId_createdAt_idx" ON "DeepCleanEstimatorMonitoringAlertExecution"("alertId", "createdAt");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringAlertExecution_action_createdAt_idx" ON "DeepCleanEstimatorMonitoringAlertExecution"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "DeepCleanEstimatorMonitoringAlertExecution" ADD CONSTRAINT "DeepCleanEstimatorMonitoringAlertExecution_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "DeepCleanEstimatorMonitoringAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
