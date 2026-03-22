-- CreateEnum
CREATE TYPE "BookingOpsEmailProvider" AS ENUM ('stub', 'resend');

-- AlterTable
ALTER TABLE "BookingOpsNotification" ADD COLUMN     "nextRetryAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BookingOpsNotificationDelivery" ADD COLUMN     "httpStatusCode" INTEGER,
ADD COLUMN     "provider" "BookingOpsEmailProvider",
ADD COLUMN     "providerMessageId" TEXT;
