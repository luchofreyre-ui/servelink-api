-- Additive correlation hook on booking events (optional population by writers later).
ALTER TABLE "BookingEvent" ADD COLUMN "correlationId" TEXT;

CREATE INDEX "BookingEvent_correlationId_idx" ON "BookingEvent"("correlationId");

-- Durable operational outbox (delivery workers / notifications — not consumed by API yet).
CREATE TABLE "OperationalOutboxEvent" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "lifecycleCategory" TEXT,
    "operationalEventCategory" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishAfter" TIMESTAMP(3),
    "processingState" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),

    CONSTRAINT "OperationalOutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalOutboxEvent_dedupeKey_key" ON "OperationalOutboxEvent"("dedupeKey");

CREATE INDEX "OperationalOutboxEvent_aggregateType_aggregateId_createdAt_idx" ON "OperationalOutboxEvent"("aggregateType", "aggregateId", "createdAt");

CREATE INDEX "OperationalOutboxEvent_correlationId_idx" ON "OperationalOutboxEvent"("correlationId");

CREATE INDEX "OperationalOutboxEvent_processingState_createdAt_idx" ON "OperationalOutboxEvent"("processingState", "createdAt");
