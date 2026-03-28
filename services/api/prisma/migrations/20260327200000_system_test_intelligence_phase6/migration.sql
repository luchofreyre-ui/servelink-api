-- Phase 6: analysis lifecycle + rename analyzedAt -> lastAnalyzedAt

ALTER TABLE "SystemTestRunIntelligence" RENAME COLUMN "analyzedAt" TO "lastAnalyzedAt";

ALTER TABLE "SystemTestRunIntelligence" ADD COLUMN "analysisStatus" TEXT NOT NULL DEFAULT 'completed';

ALTER TABLE "SystemTestRunIntelligence" ADD COLUMN "analysisError" TEXT;

CREATE INDEX "SystemTestRunIntelligence_analysisStatus_idx" ON "SystemTestRunIntelligence"("analysisStatus");
