-- CreateEnum
CREATE TYPE "BookingOpsNotificationChannel" AS ENUM ('in_app', 'email');

-- AlterTable
ALTER TABLE "BookingOpsNotification" ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "channel" "BookingOpsNotificationChannel" NOT NULL DEFAULT 'in_app',
ADD COLUMN     "firstAttemptAt" TIMESTAMP(3),
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "message" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "BookingOpsNotificationDelivery" (
    "id" TEXT NOT NULL,
    "bookingOpsNotificationId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "channel" "BookingOpsNotificationChannel" NOT NULL,
    "status" "BookingOpsNotificationStatus" NOT NULL,
    "payloadJson" JSONB,
    "responseJson" JSONB,
    "failureReason" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingOpsNotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingOpsNotificationDelivery_bookingOpsNotificationId_att_idx" ON "BookingOpsNotificationDelivery"("bookingOpsNotificationId", "attemptedAt");

-- CreateIndex
CREATE INDEX "BookingOpsNotificationDelivery_channel_status_attemptedAt_idx" ON "BookingOpsNotificationDelivery"("channel", "status", "attemptedAt");

-- AddForeignKey
ALTER TABLE "BookingOpsNotificationDelivery" ADD CONSTRAINT "BookingOpsNotificationDelivery_bookingOpsNotificationId_fkey" FOREIGN KEY ("bookingOpsNotificationId") REFERENCES "BookingOpsNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
