-- AlterTable
ALTER TABLE "StripeWebhookReceipt" ADD COLUMN "bookingResolvedId" TEXT;
ALTER TABLE "StripeWebhookReceipt" ADD COLUMN "endpointPath" TEXT;

-- CreateTable
CREATE TABLE "PaymentAnomaly" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "stripeEventId" TEXT,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "status" TEXT NOT NULL DEFAULT 'open',
    "message" TEXT NOT NULL,
    "details" JSONB,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhookFailure" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT,
    "eventType" TEXT,
    "endpointPath" TEXT NOT NULL,
    "failureKind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentWebhookFailure_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentAnomaly_bookingId_status_idx" ON "PaymentAnomaly"("bookingId", "status");
CREATE INDEX "PaymentAnomaly_stripeEventId_idx" ON "PaymentAnomaly"("stripeEventId");
CREATE INDEX "PaymentAnomaly_kind_detectedAt_idx" ON "PaymentAnomaly"("kind", "detectedAt");

CREATE INDEX "PaymentWebhookFailure_stripeEventId_idx" ON "PaymentWebhookFailure"("stripeEventId");
CREATE INDEX "PaymentWebhookFailure_eventType_createdAt_idx" ON "PaymentWebhookFailure"("eventType", "createdAt");
