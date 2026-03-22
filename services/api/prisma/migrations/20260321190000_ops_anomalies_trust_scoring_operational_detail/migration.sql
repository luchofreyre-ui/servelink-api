-- DropTable (replace TrustEvent shape; prior rows were string-typed / optional FO)
DROP TABLE IF EXISTS "TrustEvent";

-- CreateEnum
CREATE TYPE "TrustEventType" AS ENUM (
  'start',
  'complete',
  'incident',
  'qc_pass',
  'qc_fail',
  'evidence_uploaded',
  'customer_review'
);

-- CreateEnum
CREATE TYPE "OpsAnomalyStatus" AS ENUM ('open', 'acknowledged', 'resolved');

-- AlterEnum (operational values on existing OpsAnomalyType; one statement per value)
ALTER TYPE "OpsAnomalyType" ADD VALUE 'payment_missing';
ALTER TYPE "OpsAnomalyType" ADD VALUE 'payment_mismatch';
ALTER TYPE "OpsAnomalyType" ADD VALUE 'dispatch_failed';
ALTER TYPE "OpsAnomalyType" ADD VALUE 'fo_unavailable_accept';
ALTER TYPE "OpsAnomalyType" ADD VALUE 'execution_missing_start';
ALTER TYPE "OpsAnomalyType" ADD VALUE 'execution_missing_complete';
ALTER TYPE "OpsAnomalyType" ADD VALUE 'trust_incident_spike';

-- CreateTable
CREATE TABLE "TrustEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "foId" TEXT,
    "type" "TrustEventType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsAnomaly" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "foId" TEXT,
    "type" "OpsAnomalyType" NOT NULL,
    "status" "OpsAnomalyStatus" NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "fingerprint" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "OpsAnomaly_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "quotedSubtotal" DECIMAL(10,2);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "quotedMargin" DECIMAL(10,2);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "quotedTotal" DECIMAL(10,2);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentIntentId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "enRouteAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TrustEvent_bookingId_createdAt_idx" ON "TrustEvent"("bookingId", "createdAt");
CREATE INDEX "TrustEvent_foId_createdAt_idx" ON "TrustEvent"("foId", "createdAt");
CREATE INDEX "TrustEvent_type_createdAt_idx" ON "TrustEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAnomaly_status_createdAt_idx" ON "OpsAnomaly"("status", "createdAt");
CREATE INDEX "OpsAnomaly_type_createdAt_idx" ON "OpsAnomaly"("type", "createdAt");
CREATE INDEX "OpsAnomaly_bookingId_status_idx" ON "OpsAnomaly"("bookingId", "status");
CREATE INDEX "OpsAnomaly_foId_status_idx" ON "OpsAnomaly"("foId", "status");
CREATE INDEX "OpsAnomaly_fingerprint_idx" ON "OpsAnomaly"("fingerprint");

-- AddForeignKey
ALTER TABLE "TrustEvent" ADD CONSTRAINT "TrustEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrustEvent" ADD CONSTRAINT "TrustEvent_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsAnomaly" ADD CONSTRAINT "OpsAnomaly_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsAnomaly" ADD CONSTRAINT "OpsAnomaly_foId_fkey" FOREIGN KEY ("foId") REFERENCES "FranchiseOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
