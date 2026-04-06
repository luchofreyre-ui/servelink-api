-- Stripe-backed booking checkout linkage + webhook payload storage
ALTER TABLE "Booking" ADD COLUMN "stripeCheckoutSessionId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "stripeLastEventId" TEXT;

CREATE UNIQUE INDEX "Booking_stripeCheckoutSessionId_key" ON "Booking"("stripeCheckoutSessionId");

ALTER TABLE "StripeWebhookReceipt" ADD COLUMN "payload" JSONB;
