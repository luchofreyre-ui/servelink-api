-- CreateTable
CREATE TABLE "KnowledgeReviewSignal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "signalType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityKey" TEXT NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "workedRate" DOUBLE PRECISION,
    "partialRate" DOUBLE PRECISION,
    "failedRate" DOUBLE PRECISION,
    "avgTimeVarianceMinutes" DOUBLE PRECISION,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metadataJson" JSONB,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL,
    "lastDetectedAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "acknowledgedByUserId" TEXT,
    "resolvedByUserId" TEXT,

    CONSTRAINT "KnowledgeReviewSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeReviewSignal_entityType_entityKey_idx" ON "KnowledgeReviewSignal"("entityType", "entityKey");

-- CreateIndex
CREATE INDEX "KnowledgeReviewSignal_status_idx" ON "KnowledgeReviewSignal"("status");

-- CreateIndex
CREATE INDEX "KnowledgeReviewSignal_signalType_idx" ON "KnowledgeReviewSignal"("signalType");
