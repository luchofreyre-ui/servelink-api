-- CreateTable
CREATE TABLE "DeepCleanEstimatorMonitoringNotificationRoute" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "severity" TEXT,
    "escalationLevel" TEXT,
    "recommendedAction" TEXT,
    "channel" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "destinationLabel" TEXT,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeepCleanEstimatorMonitoringNotificationRoute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringNotificationRoute_isEnabled_severity_escalationLevel_idx" ON "DeepCleanEstimatorMonitoringNotificationRoute"("isEnabled", "severity", "escalationLevel");

-- CreateTable
CREATE TABLE "DeepCleanEstimatorMonitoringNotificationSend" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "payloadJson" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeepCleanEstimatorMonitoringNotificationSend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeepCleanEstimatorMonitoringNotificationSend_dedupeKey_key" ON "DeepCleanEstimatorMonitoringNotificationSend"("dedupeKey");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringNotificationSend_alertId_createdAt_idx" ON "DeepCleanEstimatorMonitoringNotificationSend"("alertId", "createdAt");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringNotificationSend_status_createdAt_idx" ON "DeepCleanEstimatorMonitoringNotificationSend"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "DeepCleanEstimatorMonitoringNotificationSend" ADD CONSTRAINT "DeepCleanEstimatorMonitoringNotificationSend_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "DeepCleanEstimatorMonitoringAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DeepCleanEstimatorMonitoringNotificationDigestCursor" (
    "id" TEXT NOT NULL,
    "digestKey" TEXT NOT NULL,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeepCleanEstimatorMonitoringNotificationDigestCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeepCleanEstimatorMonitoringNotificationDigestCursor_digestKey_key" ON "DeepCleanEstimatorMonitoringNotificationDigestCursor"("digestKey");
