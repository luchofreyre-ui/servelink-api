-- Phase 10 Drop 1: incident action workflow (keyed by incidentKey)

CREATE TYPE "SystemTestIncidentActionStatus" AS ENUM ('open', 'investigating', 'fixing', 'validating', 'resolved', 'dismissed');

CREATE TYPE "SystemTestIncidentActionPriority" AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE "SystemTestIncidentStepExecutionStatus" AS ENUM ('pending', 'in_progress', 'completed');

CREATE TYPE "SystemTestIncidentEventType" AS ENUM ('action_created', 'assigned', 'unassigned', 'priority_changed', 'status_changed', 'note_added');

CREATE TABLE "SystemTestIncidentAction" (
    "id" TEXT NOT NULL,
    "incidentKey" TEXT NOT NULL,
    "status" "SystemTestIncidentActionStatus" NOT NULL DEFAULT 'open',
    "priority" "SystemTestIncidentActionPriority" NOT NULL DEFAULT 'medium',
    "ownerUserId" TEXT,
    "lastSeenRunId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SystemTestIncidentAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestIncidentAction_incidentKey_key" ON "SystemTestIncidentAction"("incidentKey");
CREATE INDEX "SystemTestIncidentAction_status_idx" ON "SystemTestIncidentAction"("status");
CREATE INDEX "SystemTestIncidentAction_priority_idx" ON "SystemTestIncidentAction"("priority");
CREATE INDEX "SystemTestIncidentAction_ownerUserId_idx" ON "SystemTestIncidentAction"("ownerUserId");
CREATE INDEX "SystemTestIncidentAction_lastSeenRunId_idx" ON "SystemTestIncidentAction"("lastSeenRunId");
CREATE INDEX "SystemTestIncidentAction_status_priority_idx" ON "SystemTestIncidentAction"("status", "priority");

ALTER TABLE "SystemTestIncidentAction" ADD CONSTRAINT "SystemTestIncidentAction_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SystemTestIncidentStepExecution" (
    "id" TEXT NOT NULL,
    "incidentActionId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "status" "SystemTestIncidentStepExecutionStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemTestIncidentStepExecution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestIncidentStepExecution_incidentActionId_stepIndex_key" ON "SystemTestIncidentStepExecution"("incidentActionId", "stepIndex");
CREATE INDEX "SystemTestIncidentStepExecution_incidentActionId_idx" ON "SystemTestIncidentStepExecution"("incidentActionId");
CREATE INDEX "SystemTestIncidentStepExecution_status_idx" ON "SystemTestIncidentStepExecution"("status");

ALTER TABLE "SystemTestIncidentStepExecution" ADD CONSTRAINT "SystemTestIncidentStepExecution_incidentActionId_fkey" FOREIGN KEY ("incidentActionId") REFERENCES "SystemTestIncidentAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SystemTestIncidentEvent" (
    "id" TEXT NOT NULL,
    "incidentActionId" TEXT NOT NULL,
    "incidentKey" TEXT NOT NULL,
    "type" "SystemTestIncidentEventType" NOT NULL,
    "actorUserId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemTestIncidentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SystemTestIncidentEvent_incidentActionId_createdAt_idx" ON "SystemTestIncidentEvent"("incidentActionId", "createdAt");
CREATE INDEX "SystemTestIncidentEvent_incidentKey_createdAt_idx" ON "SystemTestIncidentEvent"("incidentKey", "createdAt");
CREATE INDEX "SystemTestIncidentEvent_type_createdAt_idx" ON "SystemTestIncidentEvent"("type", "createdAt");

ALTER TABLE "SystemTestIncidentEvent" ADD CONSTRAINT "SystemTestIncidentEvent_incidentActionId_fkey" FOREIGN KEY ("incidentActionId") REFERENCES "SystemTestIncidentAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SystemTestIncidentEvent" ADD CONSTRAINT "SystemTestIncidentEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SystemTestIncidentNote" (
    "id" TEXT NOT NULL,
    "incidentActionId" TEXT NOT NULL,
    "incidentKey" TEXT NOT NULL,
    "userId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemTestIncidentNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SystemTestIncidentNote_incidentActionId_createdAt_idx" ON "SystemTestIncidentNote"("incidentActionId", "createdAt");
CREATE INDEX "SystemTestIncidentNote_incidentKey_createdAt_idx" ON "SystemTestIncidentNote"("incidentKey", "createdAt");

ALTER TABLE "SystemTestIncidentNote" ADD CONSTRAINT "SystemTestIncidentNote_incidentActionId_fkey" FOREIGN KEY ("incidentActionId") REFERENCES "SystemTestIncidentAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SystemTestIncidentNote" ADD CONSTRAINT "SystemTestIncidentNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
