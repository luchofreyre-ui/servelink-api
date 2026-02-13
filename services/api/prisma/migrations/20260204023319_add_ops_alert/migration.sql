-- CreateEnum
CREATE TYPE "OpsAlertStatus" AS ENUM ('open', 'acked');

-- CreateEnum
CREATE TYPE "OpsAnomalyType" AS ENUM ('INTEGRITY_REFUND_WEBHOOK_MISSING', 'INTEGRITY_DISPUTE_STALE', 'INTEGRITY_BILLING_SESSION_STALE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "OpsAlert" (
    "id" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "bookingId" TEXT NOT NULL,
    "foId" TEXT,
    "bookingStatus" "BookingStatus",
    "anomalyType" "OpsAnomalyType" NOT NULL,
    "status" "OpsAlertStatus" NOT NULL DEFAULT 'open',
    "payloadJson" TEXT,
    "ackedAt" TIMESTAMP(3),
    "ackedByAdminId" TEXT,
    "ackNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpsAlert_sourceEventId_key" ON "OpsAlert"("sourceEventId");

-- CreateIndex
CREATE INDEX "OpsAlert_bookingId_createdAt_idx" ON "OpsAlert"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlert_status_createdAt_idx" ON "OpsAlert"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlert_anomalyType_createdAt_idx" ON "OpsAlert"("anomalyType", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlert_foId_createdAt_idx" ON "OpsAlert"("foId", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlert_bookingStatus_createdAt_idx" ON "OpsAlert"("bookingStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "OpsAlert" ADD CONSTRAINT "OpsAlert_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
