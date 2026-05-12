-- Phase 9: worker-ready fields + delivery attempt audit trail (additive).

ALTER TABLE "OperationalOutboxEvent" ADD COLUMN "processingStartedAt" TIMESTAMP(3),
ADD COLUMN "payloadSchemaVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "lastDeliveryResultJson" JSONB,
ADD COLUMN "processingError" TEXT;

CREATE TABLE "OperationalOutboxDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "outboxEventId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL,
    "resultJson" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalOutboxDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalOutboxDeliveryAttempt_outboxEventId_createdAt_idx"
ON "OperationalOutboxDeliveryAttempt"("outboxEventId", "createdAt");

ALTER TABLE "OperationalOutboxDeliveryAttempt"
ADD CONSTRAINT "OperationalOutboxDeliveryAttempt_outboxEventId_fkey"
FOREIGN KEY ("outboxEventId") REFERENCES "OperationalOutboxEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
