-- CreateEnum
CREATE TYPE "SystemTestAutomationJobType" AS ENUM ('digest', 'regression_alert', 'triage_generation');

-- CreateEnum
CREATE TYPE "SystemTestAutomationJobStatus" AS ENUM ('pending', 'generated', 'sent', 'suppressed', 'failed');

-- CreateEnum
CREATE TYPE "SystemTestAutomationTriggerSource" AS ENUM ('schedule', 'manual', 'test');

-- CreateTable
CREATE TABLE "SystemTestAutomationJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "SystemTestAutomationJobType" NOT NULL,
    "status" "SystemTestAutomationJobStatus" NOT NULL,
    "triggerSource" "SystemTestAutomationTriggerSource" NOT NULL,
    "targetRunId" TEXT,
    "baseRunId" TEXT,
    "reportKind" TEXT NOT NULL,
    "headline" TEXT,
    "shortSummary" TEXT,
    "dedupeKey" TEXT,
    "suppressionReason" TEXT,
    "payloadJson" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "SystemTestAutomationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemTestAutomationJob_type_createdAt_idx" ON "SystemTestAutomationJob"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SystemTestAutomationJob_dedupeKey_createdAt_idx" ON "SystemTestAutomationJob"("dedupeKey", "createdAt");

-- CreateIndex
CREATE INDEX "SystemTestAutomationJob_status_createdAt_idx" ON "SystemTestAutomationJob"("status", "createdAt");
