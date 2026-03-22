-- CreateEnum
CREATE TYPE "BookingOpsNotificationKind" AS ENUM ('completion_ready', 'completion_ready_reminder', 'overage_requested', 'overage_approved', 'overage_declined', 'payment_capture_failed', 'payment_action_required');

-- CreateEnum
CREATE TYPE "BookingOpsNotificationRecipientType" AS ENUM ('customer', 'franchise_owner', 'admin');

-- CreateEnum
CREATE TYPE "BookingOpsNotificationStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "BookingOpsExceptionKind" AS ENUM ('payment_action_required', 'overage_declined', 'capture_failed', 'completion_ready_stale');

-- CreateEnum
CREATE TYPE "BookingOpsExceptionStatus" AS ENUM ('open', 'acknowledged', 'resolved');

-- CreateTable
CREATE TABLE "BookingOpsNotification" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "recipientType" "BookingOpsNotificationRecipientType" NOT NULL,
    "recipientUserId" TEXT,
    "kind" "BookingOpsNotificationKind" NOT NULL,
    "status" "BookingOpsNotificationStatus" NOT NULL DEFAULT 'pending',
    "dedupKey" TEXT NOT NULL,
    "payloadJson" JSONB,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingOpsNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingOpsException" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kind" "BookingOpsExceptionKind" NOT NULL,
    "status" "BookingOpsExceptionStatus" NOT NULL DEFAULT 'open',
    "dedupKey" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detailsJson" JSONB,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingOpsException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingOpsNotification_dedupKey_key" ON "BookingOpsNotification"("dedupKey");

-- CreateIndex
CREATE INDEX "BookingOpsNotification_bookingId_kind_status_idx" ON "BookingOpsNotification"("bookingId", "kind", "status");

-- CreateIndex
CREATE INDEX "BookingOpsNotification_recipientType_status_createdAt_idx" ON "BookingOpsNotification"("recipientType", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingOpsException_dedupKey_key" ON "BookingOpsException"("dedupKey");

-- CreateIndex
CREATE INDEX "BookingOpsException_bookingId_kind_status_idx" ON "BookingOpsException"("bookingId", "kind", "status");

-- CreateIndex
CREATE INDEX "BookingOpsException_status_kind_createdAt_idx" ON "BookingOpsException"("status", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "BookingOpsNotification" ADD CONSTRAINT "BookingOpsNotification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingOpsException" ADD CONSTRAINT "BookingOpsException_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
