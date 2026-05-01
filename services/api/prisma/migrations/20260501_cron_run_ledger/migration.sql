CREATE TABLE "CronRunLedger" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronRunLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CronRunLedger_jobName_startedAt_idx" ON "CronRunLedger"("jobName", "startedAt");
CREATE INDEX "CronRunLedger_status_startedAt_idx" ON "CronRunLedger"("status", "startedAt");
CREATE INDEX "CronRunLedger_jobName_status_startedAt_idx" ON "CronRunLedger"("jobName", "status", "startedAt");
