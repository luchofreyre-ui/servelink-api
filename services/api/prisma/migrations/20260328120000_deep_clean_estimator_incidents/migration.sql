-- CreateTable
CREATE TABLE "DeepCleanEstimatorIncident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeepCleanEstimatorIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeepCleanEstimatorIncident_fingerprint_key" ON "DeepCleanEstimatorIncident"("fingerprint");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorIncident_state_severity_lastSeenAt_idx" ON "DeepCleanEstimatorIncident"("state", "severity", "lastSeenAt");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorIncident_fingerprint_idx" ON "DeepCleanEstimatorIncident"("fingerprint");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorIncident_openedAt_idx" ON "DeepCleanEstimatorIncident"("openedAt");

-- CreateTable
CREATE TABLE "DeepCleanEstimatorIncidentActivity" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorUserId" TEXT,
    "message" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeepCleanEstimatorIncidentActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorIncidentActivity_incidentId_createdAt_idx" ON "DeepCleanEstimatorIncidentActivity"("incidentId", "createdAt");

-- AddForeignKey
ALTER TABLE "DeepCleanEstimatorIncidentActivity" ADD CONSTRAINT "DeepCleanEstimatorIncidentActivity_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DeepCleanEstimatorIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DeepCleanEstimatorIncidentAlert" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeepCleanEstimatorIncidentAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeepCleanEstimatorIncidentAlert_incidentId_alertId_key" ON "DeepCleanEstimatorIncidentAlert"("incidentId", "alertId");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorIncidentAlert_alertId_idx" ON "DeepCleanEstimatorIncidentAlert"("alertId");

-- AddForeignKey
ALTER TABLE "DeepCleanEstimatorIncidentAlert" ADD CONSTRAINT "DeepCleanEstimatorIncidentAlert_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DeepCleanEstimatorIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeepCleanEstimatorIncidentAlert" ADD CONSTRAINT "DeepCleanEstimatorIncidentAlert_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "DeepCleanEstimatorMonitoringAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
