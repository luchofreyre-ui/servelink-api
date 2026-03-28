-- Phase 5B: persisted canonical system test intelligence

CREATE TABLE "SystemTestRunIntelligence" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "runId" TEXT NOT NULL,
    "ingestionVersion" TEXT NOT NULL,
    "sourceContentHash" TEXT NOT NULL,
    "canonicalRunAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "passedCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "flakyCount" INTEGER NOT NULL,
    "passRate" DOUBLE PRECISION NOT NULL,
    "durationMs" INTEGER,
    "branch" TEXT,
    "commitSha" TEXT,
    "chronologyJson" JSONB NOT NULL,
    "ingestionWarningsJson" JSONB NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemTestRunIntelligence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestRunIntelligence_runId_key" ON "SystemTestRunIntelligence"("runId");

CREATE INDEX "SystemTestRunIntelligence_ingestionVersion_idx" ON "SystemTestRunIntelligence"("ingestionVersion");

CREATE INDEX "SystemTestRunIntelligence_sourceContentHash_idx" ON "SystemTestRunIntelligence"("sourceContentHash");

ALTER TABLE "SystemTestRunIntelligence" ADD CONSTRAINT "SystemTestRunIntelligence_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SystemTestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SystemTestFailureGroup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runId" TEXT NOT NULL,
    "runIntelligenceId" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "canonicalFingerprint" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "projectName" TEXT,
    "title" TEXT NOT NULL,
    "shortMessage" TEXT NOT NULL,
    "fullMessage" TEXT,
    "finalStatus" TEXT,
    "occurrences" INTEGER NOT NULL,
    "testTitlesJson" JSONB NOT NULL,
    "evidenceSummaryJson" JSONB NOT NULL,
    "diagnosticPreviewJson" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "SystemTestFailureGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestFailureGroup_runIntelligenceId_canonicalKey_key" ON "SystemTestFailureGroup"("runIntelligenceId", "canonicalKey");

CREATE INDEX "SystemTestFailureGroup_runId_idx" ON "SystemTestFailureGroup"("runId");

CREATE INDEX "SystemTestFailureGroup_canonicalFingerprint_idx" ON "SystemTestFailureGroup"("canonicalFingerprint");

CREATE INDEX "SystemTestFailureGroup_runIntelligenceId_idx" ON "SystemTestFailureGroup"("runIntelligenceId");

ALTER TABLE "SystemTestFailureGroup" ADD CONSTRAINT "SystemTestFailureGroup_runIntelligenceId_fkey" FOREIGN KEY ("runIntelligenceId") REFERENCES "SystemTestRunIntelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SystemTestSpecSummary" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runId" TEXT NOT NULL,
    "runIntelligenceId" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "passedCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "passRate" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "SystemTestSpecSummary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestSpecSummary_runIntelligenceId_file_key" ON "SystemTestSpecSummary"("runIntelligenceId", "file");

CREATE INDEX "SystemTestSpecSummary_runId_idx" ON "SystemTestSpecSummary"("runId");

CREATE INDEX "SystemTestSpecSummary_runIntelligenceId_idx" ON "SystemTestSpecSummary"("runIntelligenceId");

ALTER TABLE "SystemTestSpecSummary" ADD CONSTRAINT "SystemTestSpecSummary_runIntelligenceId_fkey" FOREIGN KEY ("runIntelligenceId") REFERENCES "SystemTestRunIntelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
