-- CreateTable
CREATE TABLE "SystemTestRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "branch" TEXT,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "passedCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "flakyCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "rawReportJson" JSONB NOT NULL,
    "summaryJson" JSONB,
    "ingestVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SystemTestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemTestCaseResult" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "runId" TEXT NOT NULL,
    "suite" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "expectedStatus" TEXT,
    "line" INTEGER,
    "column" INTEGER,
    "route" TEXT,
    "selector" TEXT,
    "artifactJson" JSONB,
    "rawCaseJson" JSONB NOT NULL,

    CONSTRAINT "SystemTestCaseResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemTestRun_createdAt_idx" ON "SystemTestRun"("createdAt");

-- CreateIndex
CREATE INDEX "SystemTestRun_status_createdAt_idx" ON "SystemTestRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SystemTestCaseResult_runId_status_idx" ON "SystemTestCaseResult"("runId", "status");

-- CreateIndex
CREATE INDEX "SystemTestCaseResult_runId_suite_idx" ON "SystemTestCaseResult"("runId", "suite");

-- CreateIndex
CREATE INDEX "SystemTestCaseResult_filePath_idx" ON "SystemTestCaseResult"("filePath");

-- CreateIndex
CREATE INDEX "SystemTestCaseResult_status_idx" ON "SystemTestCaseResult"("status");

-- AddForeignKey
ALTER TABLE "SystemTestCaseResult" ADD CONSTRAINT "SystemTestCaseResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SystemTestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
