-- CreateEnum
CREATE TYPE "ConversionAlertSeverity" AS ENUM ('warning', 'critical');

-- CreateEnum
CREATE TYPE "ConversionAlertKind" AS ENUM ('kpi_critical', 'kpi_warning', 'anomaly_high', 'segment_watchlist', 'system_test', 'daily_digest', 'weekly_digest');

-- CreateEnum
CREATE TYPE "ConversionAlertDispatchStatus" AS ENUM ('sent', 'suppressed', 'failed', 'preview', 'skipped');

-- CreateEnum
CREATE TYPE "ConversionAlertChannel" AS ENUM ('slack', 'email', 'webhook');

-- CreateEnum
CREATE TYPE "ConversionScheduledRunKind" AS ENUM ('alerts_evaluation', 'daily_digest', 'weekly_digest', 'manual_test');

-- CreateEnum
CREATE TYPE "ConversionScheduledRunStatus" AS ENUM ('ran', 'skipped', 'failed', 'preview');

-- CreateTable
CREATE TABLE "ConversionMonitoringConfig" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "alertsRunnerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "alertsRunnerFrequency" TEXT NOT NULL DEFAULT 'daily',
    "dailyDigestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestChannelsJson" JSONB NOT NULL,
    "sendOnNoChange" BOOLEAN NOT NULL DEFAULT false,
    "minimumChangeThreshold" DECIMAL(8,4) NOT NULL DEFAULT 0.05,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 180,
    "includeWarnings" BOOLEAN NOT NULL DEFAULT true,
    "includeWatchlistAlerts" BOOLEAN NOT NULL DEFAULT true,
    "severityRoutingJson" JSONB NOT NULL,
    "slackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "slackWebhookUrl" TEXT,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailWebhookUrl" TEXT,
    "emailTo" TEXT,
    "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "webhookUrl" TEXT,
    "webhookAuthHeader" TEXT,
    "lastAlertsEvaluationAt" TIMESTAMP(3),
    "lastDailyDigestPeriodKey" TEXT,
    "lastWeeklyDigestPeriodKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversionMonitoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionAlertHistory" (
    "id" TEXT NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "ConversionAlertKind" NOT NULL,
    "severity" "ConversionAlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "channel" "ConversionAlertChannel",
    "status" "ConversionAlertDispatchStatus" NOT NULL,
    "source" TEXT NOT NULL,
    "metric" TEXT,
    "dimension" TEXT,
    "value" TEXT,
    "periodKey" TEXT,
    "suppressionReason" TEXT,
    "contentHash" TEXT,
    "metadataJson" JSONB,
    "dispatchResultsJson" JSONB,

    CONSTRAINT "ConversionAlertHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionScheduledRunHistory" (
    "id" TEXT NOT NULL,
    "kind" "ConversionScheduledRunKind" NOT NULL,
    "status" "ConversionScheduledRunStatus" NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB,

    CONSTRAINT "ConversionScheduledRunHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversionAlertHistory_createdAt_idx" ON "ConversionAlertHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ConversionAlertHistory_dedupKey_createdAt_idx" ON "ConversionAlertHistory"("dedupKey", "createdAt");

-- CreateIndex
CREATE INDEX "ConversionAlertHistory_kind_createdAt_idx" ON "ConversionAlertHistory"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "ConversionAlertHistory_status_createdAt_idx" ON "ConversionAlertHistory"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ConversionScheduledRunHistory_createdAt_idx" ON "ConversionScheduledRunHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ConversionScheduledRunHistory_kind_createdAt_idx" ON "ConversionScheduledRunHistory"("kind", "createdAt");
