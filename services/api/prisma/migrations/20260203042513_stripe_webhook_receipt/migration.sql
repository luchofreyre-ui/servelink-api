-- CreateTable
CREATE TABLE "StripeWebhookReceipt" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookReceipt_stripeEventId_key" ON "StripeWebhookReceipt"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeWebhookReceipt_type_createdAt_idx" ON "StripeWebhookReceipt"("type", "createdAt");

-- CreateIndex
CREATE INDEX "StripeWebhookReceipt_bookingId_createdAt_idx" ON "StripeWebhookReceipt"("bookingId", "createdAt");
