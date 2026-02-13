-- CreateTable
CREATE TABLE "OpsAlertRollup" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "anomalyType" "OpsAnomalyType" NOT NULL,
    "bookingId" TEXT NOT NULL,
    "foId" TEXT,
    "bookingStatus" "BookingStatus",
    "status" "OpsAlertStatus" NOT NULL DEFAULT 'open',
    "severity" "OpsAlertSeverity" NOT NULL DEFAULT 'warning',
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "assignedToAdminId" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "slaBreachedAt" TIMESTAMP(3),
    "ackedAt" TIMESTAMP(3),
    "ackedByAdminId" TEXT,
    "ackNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByAdminId" TEXT,
    "resolveNote" TEXT,
    "payloadJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsAlertRollup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpsAlertRollup_fingerprint_key" ON "OpsAlertRollup"("fingerprint");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_bookingId_createdAt_idx" ON "OpsAlertRollup"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_status_createdAt_idx" ON "OpsAlertRollup"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_status_lastSeenAt_idx" ON "OpsAlertRollup"("status", "lastSeenAt");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_severity_createdAt_idx" ON "OpsAlertRollup"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_anomalyType_createdAt_idx" ON "OpsAlertRollup"("anomalyType", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_foId_createdAt_idx" ON "OpsAlertRollup"("foId", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_bookingStatus_createdAt_idx" ON "OpsAlertRollup"("bookingStatus", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_assignedToAdminId_status_createdAt_idx" ON "OpsAlertRollup"("assignedToAdminId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_status_slaDueAt_idx" ON "OpsAlertRollup"("status", "slaDueAt");

-- AddForeignKey
ALTER TABLE "OpsAlertRollup" ADD CONSTRAINT "OpsAlertRollup_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
