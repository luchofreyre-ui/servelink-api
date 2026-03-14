-- AlterEnum
ALTER TYPE "OpsAnomalyType" ADD VALUE 'PAYOUT_EXECUTION_BLOCKED';

-- DropForeignKey
ALTER TABLE "OpsAlert" DROP CONSTRAINT "OpsAlert_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "OpsAlertRollup" DROP CONSTRAINT "OpsAlertRollup_bookingId_fkey";

-- AlterTable
ALTER TABLE "OpsAlert" ALTER COLUMN "bookingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OpsAlertRollup" ALTER COLUMN "bookingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OpsAlert" ADD CONSTRAINT "OpsAlert_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsAlertRollup" ADD CONSTRAINT "OpsAlertRollup_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
