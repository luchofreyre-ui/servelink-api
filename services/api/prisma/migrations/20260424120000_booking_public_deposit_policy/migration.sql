-- Public booking deposit lifecycle (PR #21 follow-on: payment policy foundation)

CREATE TYPE "BookingPublicDepositStatus" AS ENUM (
  'deposit_required',
  'deposit_succeeded',
  'deposit_failed',
  'balance_pending_authorization',
  'balance_authorized',
  'balance_captured',
  'refunded',
  'cancellation_fee_retained'
);

ALTER TABLE "Booking"
ADD COLUMN "publicDepositStatus" "BookingPublicDepositStatus" NOT NULL DEFAULT 'deposit_required';

ALTER TABLE "Booking"
ADD COLUMN "publicDepositPaymentIntentId" TEXT;

ALTER TABLE "Booking"
ADD COLUMN "publicDepositAmountCents" INTEGER NOT NULL DEFAULT 10000;

ALTER TABLE "Booking"
ADD COLUMN "publicDepositPaidAt" TIMESTAMP(3);

ALTER TABLE "Booking"
ADD COLUMN "estimatedTotalCentsSnapshot" INTEGER;

ALTER TABLE "Booking"
ADD COLUMN "remainingBalanceAfterDepositCents" INTEGER;

CREATE UNIQUE INDEX "Booking_publicDepositPaymentIntentId_key" ON "Booking"("publicDepositPaymentIntentId");

UPDATE "Booking"
SET "publicDepositStatus" = 'deposit_succeeded'
WHERE "status" <> 'pending_payment';
