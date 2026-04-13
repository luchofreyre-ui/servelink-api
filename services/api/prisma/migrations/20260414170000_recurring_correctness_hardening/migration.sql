-- Phase 8: idempotency tokens, booking fingerprint, reconciliation markers
ALTER TABLE "RecurringOccurrence" ADD COLUMN "processingToken" TEXT;
ALTER TABLE "RecurringOccurrence" ADD COLUMN "bookingFingerprint" TEXT;
ALTER TABLE "RecurringOccurrence" ADD COLUMN "bookingCreatedAt" TIMESTAMP(3);
ALTER TABLE "RecurringOccurrence" ADD COLUMN "reconciliationState" TEXT DEFAULT 'clean';

DROP INDEX IF EXISTS "RecurringOccurrence_status_processingState_processingAttempts_idx";

CREATE INDEX "RecurringOccurrence_processingState_processingAttempts_status_idx" ON "RecurringOccurrence"("processingState", "processingAttempts", "status");

CREATE INDEX "RecurringOccurrence_bookingFingerprint_idx" ON "RecurringOccurrence"("bookingFingerprint");

CREATE INDEX "RecurringOccurrence_reconciliationState_idx" ON "RecurringOccurrence"("reconciliationState");
