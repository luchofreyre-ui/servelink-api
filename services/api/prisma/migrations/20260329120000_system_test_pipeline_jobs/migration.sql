-- Phase 7A: queue-backed pipeline stage persistence

CREATE TYPE "SystemTestPipelineJobStage" AS ENUM ('analysis', 'automation');

CREATE TYPE "SystemTestPipelineJobStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'retrying', 'dead');

CREATE TYPE "SystemTestPipelineTriggerSource" AS ENUM ('ingestion', 'manual', 'schedule', 'reanalysis');

CREATE TABLE "SystemTestPipelineJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "runId" TEXT,
    "stage" "SystemTestPipelineJobStage" NOT NULL,
    "status" "SystemTestPipelineJobStatus" NOT NULL DEFAULT 'queued',
    "triggerSource" "SystemTestPipelineTriggerSource" NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "queueJobId" TEXT,
    "parentJobId" TEXT,
    "dedupeKey" TEXT,
    "payloadJson" JSONB NOT NULL,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SystemTestPipelineJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SystemTestPipelineJob_runId_createdAt_idx" ON "SystemTestPipelineJob"("runId", "createdAt");

CREATE INDEX "SystemTestPipelineJob_stage_status_idx" ON "SystemTestPipelineJob"("stage", "status");

CREATE INDEX "SystemTestPipelineJob_dedupeKey_idx" ON "SystemTestPipelineJob"("dedupeKey");

CREATE INDEX "SystemTestPipelineJob_createdAt_idx" ON "SystemTestPipelineJob"("createdAt");

ALTER TABLE "SystemTestPipelineJob" ADD CONSTRAINT "SystemTestPipelineJob_parentJobId_fkey" FOREIGN KEY ("parentJobId") REFERENCES "SystemTestPipelineJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
