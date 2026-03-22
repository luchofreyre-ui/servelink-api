/*
  Warnings:

  - Changed the type of `status` on the `BookingOpsNotificationDelivery` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BookingOpsDeliveryChannelPreference" AS ENUM ('in_app_only', 'email_only', 'in_app_and_email');

-- CreateEnum
CREATE TYPE "BookingOpsNotificationDeliveryChannelStatus" AS ENUM ('pending', 'sent', 'failed', 'skipped');

-- AlterTable
ALTER TABLE "BookingOpsNotification" ADD COLUMN     "deliveredEmailAt" TIMESTAMP(3),
ADD COLUMN     "deliveredInAppAt" TIMESTAMP(3),
ADD COLUMN     "lastResolvedChannel" "BookingOpsNotificationChannel",
ADD COLUMN     "preferredChannelMode" "BookingOpsDeliveryChannelPreference" NOT NULL DEFAULT 'in_app_only';

-- AlterTable
ALTER TABLE "BookingOpsNotificationDelivery" DROP COLUMN "status",
ADD COLUMN     "status" "BookingOpsNotificationDeliveryChannelStatus" NOT NULL;

-- CreateTable
CREATE TABLE "UserNotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingOpsMode" "BookingOpsDeliveryChannelPreference" NOT NULL DEFAULT 'in_app_only',
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationPreference_userId_key" ON "UserNotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "BookingOpsNotificationDelivery_channel_status_attemptedAt_idx" ON "BookingOpsNotificationDelivery"("channel", "status", "attemptedAt");

-- AddForeignKey
ALTER TABLE "UserNotificationPreference" ADD CONSTRAINT "UserNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
