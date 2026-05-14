-- Operational analytics manual warehouse refresh audit (traceability + replay classification inputs).

CREATE TYPE "OperationalAnalyticsRefreshRunStatus" AS ENUM ('started', 'succeeded', 'failed');

CREATE TABLE "OperationalAnalyticsRefreshRun" (
    "refreshRunId" TEXT NOT NULL,
    "triggerSource" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "requestedByEmail" TEXT,
    "sourceRoute" TEXT NOT NULL,
    "aggregateWindow" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "status" "OperationalAnalyticsRefreshRunStatus" NOT NULL,
    "beforeFreshnessState" TEXT NOT NULL,
    "afterFreshnessState" TEXT,
    "rowsTouchedByWarehouseTable" JSONB,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "stackHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalAnalyticsRefreshRun_pkey" PRIMARY KEY ("refreshRunId")
);

CREATE INDEX "OperationalAnalyticsRefreshRun_createdAt_idx" ON "OperationalAnalyticsRefreshRun"("createdAt" DESC);

CREATE INDEX "OperationalAnalyticsRefreshRun_status_finishedAt_idx" ON "OperationalAnalyticsRefreshRun"("status", "finishedAt" DESC);

CREATE INDEX "OperationalAnalyticsRefreshRun_requestedByUserId_startedAt_idx" ON "OperationalAnalyticsRefreshRun"("requestedByUserId", "startedAt" DESC);
