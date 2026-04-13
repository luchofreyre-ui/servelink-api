-- Background orchestration for recurring occurrence booking generation
ALTER TABLE "RecurringOccurrence"
ADD COLUMN "processingState" TEXT NOT NULL DEFAULT 'ready',
ADD COLUMN "processingAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastProcessingAt" TIMESTAMP(3);

CREATE INDEX "RecurringOccurrence_status_processingState_processingAttempts_idx" ON "RecurringOccurrence"("status", "processingState", "processingAttempts");
