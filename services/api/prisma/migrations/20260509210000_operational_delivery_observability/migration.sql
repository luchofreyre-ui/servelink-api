-- Phase 10: delivery observability columns on outbox attempts (additive).

ALTER TABLE "OperationalOutboxDeliveryAttempt" ADD COLUMN "providerKind" TEXT,
ADD COLUMN "notificationCategory" TEXT,
ADD COLUMN "templateKey" TEXT,
ADD COLUMN "templateVersion" INTEGER;
