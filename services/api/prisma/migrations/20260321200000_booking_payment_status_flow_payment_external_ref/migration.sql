-- AlterEnum
ALTER TYPE "BookingPaymentStatus" ADD VALUE 'requires_payment';
ALTER TYPE "BookingPaymentStatus" ADD VALUE 'paid';
ALTER TYPE "BookingPaymentStatus" ADD VALUE 'failed';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "externalRef" TEXT;

CREATE INDEX IF NOT EXISTS "Payment_externalRef_idx" ON "Payment"("externalRef");
