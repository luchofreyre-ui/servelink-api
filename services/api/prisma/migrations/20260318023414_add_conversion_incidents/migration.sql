-- CreateEnum
CREATE TYPE "ConversionIncidentStatus" AS ENUM ('open', 'acknowledged', 'resolved');

-- CreateEnum
CREATE TYPE "ConversionIncidentSeverity" AS ENUM ('warning', 'critical');

-- CreateEnum
CREATE TYPE "ConversionIncidentEventKind" AS ENUM ('opened', 'repeated_alert', 'acknowledged', 'resolved', 'reopened', 'note');

-- CreateTable
CREATE TABLE "ConversionIncident" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ConversionIncidentStatus" NOT NULL DEFAULT 'open',
    "severity" "ConversionIncidentSeverity" NOT NULL,
    "source" TEXT NOT NULL,
    "metric" TEXT,
    "dimension" TEXT,
    "value" TEXT,
    "periodKey" TEXT,
    "firstOpenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTriggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedByAdminId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByAdminId" TEXT,
    "triggerCount" INTEGER NOT NULL DEFAULT 1,
    "latestAlertHistoryId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversionIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionIncidentEvent" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "kind" "ConversionIncidentEventKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorAdminId" TEXT,
    "details" TEXT NOT NULL,
    "metadataJson" JSONB,

    CONSTRAINT "ConversionIncidentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversionIncident_status_severity_updatedAt_idx" ON "ConversionIncident"("status", "severity", "updatedAt");

-- CreateIndex
CREATE INDEX "ConversionIncident_fingerprint_updatedAt_idx" ON "ConversionIncident"("fingerprint", "updatedAt");

-- CreateIndex
CREATE INDEX "ConversionIncident_lastTriggeredAt_idx" ON "ConversionIncident"("lastTriggeredAt");

-- CreateIndex
CREATE INDEX "ConversionIncidentEvent_incidentId_createdAt_idx" ON "ConversionIncidentEvent"("incidentId", "createdAt");

-- CreateIndex
CREATE INDEX "ConversionIncidentEvent_kind_createdAt_idx" ON "ConversionIncidentEvent"("kind", "createdAt");

-- AddForeignKey
ALTER TABLE "ConversionIncidentEvent" ADD CONSTRAINT "ConversionIncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "ConversionIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
