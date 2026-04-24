-- Remaining balance authorization/capture + cancellation refund tracking (additive).
-- Runs after `20260424120000_booking_public_deposit_policy` so deposit columns exist for optional indexes.

CREATE TYPE "BookingRemainingBalancePaymentStatus" AS ENUM (
  'balance_not_required',
  'balance_pending_authorization',
  'balance_authorization_required',
  'balance_authorized',
  'balance_authorization_failed',
  'balance_captured',
  'balance_capture_failed',
  'balance_canceled'
);

CREATE TYPE "BookingDepositRefundStatus" AS ENUM (
  'refund_not_required',
  'refund_pending',
  'refund_succeeded',
  'refund_failed'
);

ALTER TABLE "Booking" ADD COLUMN "remainingBalancePaymentIntentId" TEXT;

ALTER TABLE "Booking"
ADD COLUMN "remainingBalanceStatus" "BookingRemainingBalancePaymentStatus" NOT NULL DEFAULT 'balance_not_required';

ALTER TABLE "Booking" ADD COLUMN "remainingBalanceAuthorizedAt" TIMESTAMP(3);

ALTER TABLE "Booking" ADD COLUMN "remainingBalanceCapturedAt" TIMESTAMP(3);

ALTER TABLE "Booking" ADD COLUMN "remainingBalanceAuthorizationFailureReason" TEXT;

ALTER TABLE "Booking" ADD COLUMN "cancellationFeeAmountCents" INTEGER;

ALTER TABLE "Booking" ADD COLUMN "cancellationFeeRetainedAt" TIMESTAMP(3);

ALTER TABLE "Booking" ADD COLUMN "depositRefundId" TEXT;

ALTER TABLE "Booking"
ADD COLUMN "depositRefundStatus" "BookingDepositRefundStatus" NOT NULL DEFAULT 'refund_not_required';

ALTER TABLE "Booking" ADD COLUMN "depositRefundedAt" TIMESTAMP(3);

ALTER TABLE "Booking" ADD COLUMN "canceledAt" TIMESTAMP(3);

ALTER TABLE "Booking" ADD COLUMN "canceledReason" TEXT;

CREATE UNIQUE INDEX "Booking_remainingBalancePaymentIntentId_key" ON "Booking"("remainingBalancePaymentIntentId");

CREATE INDEX "Booking_status_scheduledStart_remainingBalance_idx" ON "Booking"(
  "status",
  "scheduledStart",
  "remainingBalanceStatus"
);
