-- CreateTable
CREATE TABLE "DeepCleanEstimatorMonitoringAlert" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "version" INTEGER,
    "label" TEXT NOT NULL,
    "reason" TEXT,
    "severity" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "operatorNote" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeepCleanEstimatorMonitoringAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeepCleanEstimatorMonitoringAlert_fingerprint_key" ON "DeepCleanEstimatorMonitoringAlert"("fingerprint");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringAlert_state_updatedAt_idx" ON "DeepCleanEstimatorMonitoringAlert"("state", "updatedAt");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringAlert_code_version_idx" ON "DeepCleanEstimatorMonitoringAlert"("code", "version");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorMonitoringAlert_assignedToUserId_idx" ON "DeepCleanEstimatorMonitoringAlert"("assignedToUserId");
