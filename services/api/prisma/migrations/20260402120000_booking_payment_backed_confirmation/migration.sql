-- Replace BookingPaymentStatus with revenue-backed lifecycle values.
CREATE TYPE "BookingPaymentStatus_new" AS ENUM (
  'unpaid',
  'checkout_created',
  'payment_pending',
  'authorized',
  'paid',
  'failed',
  'refunded',
  'waived'
);

ALTER TABLE "Booking" ALTER COLUMN "paymentStatus" DROP DEFAULT;

ALTER TABLE "Booking"
  ALTER COLUMN "paymentStatus" TYPE "BookingPaymentStatus_new"
  USING (
    CASE "paymentStatus"::text
      WHEN 'none' THEN 'unpaid'::"BookingPaymentStatus_new"
      WHEN 'paid' THEN 'paid'::"BookingPaymentStatus_new"
      WHEN 'failed' THEN 'failed'::"BookingPaymentStatus_new"
      WHEN 'quote_ready' THEN 'payment_pending'::"BookingPaymentStatus_new"
      WHEN 'requires_payment' THEN 'payment_pending'::"BookingPaymentStatus_new"
      WHEN 'authorized_initial' THEN 'authorized'::"BookingPaymentStatus_new"
      WHEN 'ready_for_capture' THEN 'authorized'::"BookingPaymentStatus_new"
      WHEN 'captured' THEN 'paid'::"BookingPaymentStatus_new"
      WHEN 'additional_authorization_required' THEN 'payment_pending'::"BookingPaymentStatus_new"
      WHEN 'additional_authorization_pending' THEN 'payment_pending'::"BookingPaymentStatus_new"
      WHEN 'additional_authorization_approved' THEN 'authorized'::"BookingPaymentStatus_new"
      WHEN 'additional_authorization_declined' THEN 'failed'::"BookingPaymentStatus_new"
      ELSE 'unpaid'::"BookingPaymentStatus_new"
    END
  );

ALTER TABLE "Booking"
  ALTER COLUMN "paymentStatus" SET DEFAULT 'unpaid'::"BookingPaymentStatus_new";

DROP TYPE "BookingPaymentStatus";

ALTER TYPE "BookingPaymentStatus_new" RENAME TO "BookingPaymentStatus";

ALTER TABLE "Booking" ADD COLUMN "paymentProvider" TEXT;
ALTER TABLE "Booking" ADD COLUMN "paymentReference" TEXT;
ALTER TABLE "Booking" ADD COLUMN "paymentCheckoutUrl" TEXT;
ALTER TABLE "Booking" ADD COLUMN "paymentAmountCents" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "paymentCurrency" TEXT DEFAULT 'usd';
ALTER TABLE "Booking" ADD COLUMN "paymentAuthorizedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "paymentPaidAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "paymentFailedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "paymentWaivedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "paymentMeta" JSONB;

ALTER TABLE "BookingEvent" ADD COLUMN "actorUserId" TEXT;
ALTER TABLE "BookingEvent" ADD COLUMN "actorRole" TEXT;
ALTER TABLE "BookingEvent" ADD COLUMN "payload" JSONB;

ALTER TYPE "BookingEventType" ADD VALUE 'BOOKING_HOLD';
ALTER TYPE "BookingEventType" ADD VALUE 'PAYMENT_CHECKOUT_CREATED';
ALTER TYPE "BookingEventType" ADD VALUE 'PAYMENT_STATUS_CHANGED';
ALTER TYPE "BookingEventType" ADD VALUE 'PAYMENT_ADMIN_OVERRIDE';
