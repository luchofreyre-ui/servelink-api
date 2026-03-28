-- Phase 11B: dispatch exception operational action layer

CREATE TYPE "DispatchExceptionActionStatus" AS ENUM ('open', 'investigating', 'waiting', 'resolved', 'dismissed');

CREATE TYPE "DispatchExceptionActionPriority" AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE "DispatchExceptionActionEventType" AS ENUM (
  'action_created',
  'assigned',
  'unassigned',
  'priority_changed',
  'status_changed',
  'note_added',
  'exception_seen',
  'validation_passed',
  'validation_failed',
  'reopened',
  'sla_started',
  'sla_due_soon',
  'sla_overdue',
  'escalation_ready',
  'notification_queued'
);

CREATE TABLE "DispatchExceptionAction" (
    "id" TEXT NOT NULL,
    "dispatchExceptionKey" TEXT NOT NULL,
    "status" "DispatchExceptionActionStatus" NOT NULL DEFAULT 'open',
    "priority" "DispatchExceptionActionPriority" NOT NULL DEFAULT 'medium',
    "ownerUserId" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "lastSeenExceptionId" TEXT,
    "metadataJson" JSONB,
    "validationState" TEXT,
    "validationLastCheckedAt" TIMESTAMP(3),
    "validationLastPassedAt" TIMESTAMP(3),
    "validationLastFailedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "reopenCount" INTEGER NOT NULL DEFAULT 0,
    "slaPolicyHours" INTEGER,
    "slaStartedAt" TIMESTAMP(3),
    "slaDueAt" TIMESTAMP(3),
    "slaStatus" TEXT,
    "slaLastEvaluatedAt" TIMESTAMP(3),
    "slaDueSoonNotifiedAt" TIMESTAMP(3),
    "slaOverdueNotifiedAt" TIMESTAMP(3),
    "escalationReadyAt" TIMESTAMP(3),
    "lastNotificationQueuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DispatchExceptionAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DispatchExceptionAction_dispatchExceptionKey_key" ON "DispatchExceptionAction"("dispatchExceptionKey");
CREATE INDEX "DispatchExceptionAction_status_idx" ON "DispatchExceptionAction"("status");
CREATE INDEX "DispatchExceptionAction_priority_idx" ON "DispatchExceptionAction"("priority");
CREATE INDEX "DispatchExceptionAction_ownerUserId_idx" ON "DispatchExceptionAction"("ownerUserId");
CREATE INDEX "DispatchExceptionAction_slaStatus_idx" ON "DispatchExceptionAction"("slaStatus");
CREATE INDEX "DispatchExceptionAction_slaDueAt_idx" ON "DispatchExceptionAction"("slaDueAt");
CREATE INDEX "DispatchExceptionAction_escalationReadyAt_idx" ON "DispatchExceptionAction"("escalationReadyAt");
CREATE INDEX "DispatchExceptionAction_validationState_idx" ON "DispatchExceptionAction"("validationState");

ALTER TABLE "DispatchExceptionAction" ADD CONSTRAINT "DispatchExceptionAction_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "DispatchExceptionActionEvent" (
    "id" TEXT NOT NULL,
    "dispatchExceptionActionId" TEXT NOT NULL,
    "dispatchExceptionKey" TEXT NOT NULL,
    "type" "DispatchExceptionActionEventType" NOT NULL,
    "actorUserId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchExceptionActionEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DispatchExceptionActionEvent_dispatchExceptionActionId_createdAt_idx" ON "DispatchExceptionActionEvent"("dispatchExceptionActionId", "createdAt");
CREATE INDEX "DispatchExceptionActionEvent_dispatchExceptionKey_createdAt_idx" ON "DispatchExceptionActionEvent"("dispatchExceptionKey", "createdAt");

ALTER TABLE "DispatchExceptionActionEvent" ADD CONSTRAINT "DispatchExceptionActionEvent_dispatchExceptionActionId_fkey" FOREIGN KEY ("dispatchExceptionActionId") REFERENCES "DispatchExceptionAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DispatchExceptionActionEvent" ADD CONSTRAINT "DispatchExceptionActionEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "DispatchExceptionActionNote" (
    "id" TEXT NOT NULL,
    "dispatchExceptionActionId" TEXT NOT NULL,
    "dispatchExceptionKey" TEXT NOT NULL,
    "userId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchExceptionActionNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DispatchExceptionActionNote_dispatchExceptionActionId_createdAt_idx" ON "DispatchExceptionActionNote"("dispatchExceptionActionId", "createdAt");
CREATE INDEX "DispatchExceptionActionNote_dispatchExceptionKey_createdAt_idx" ON "DispatchExceptionActionNote"("dispatchExceptionKey", "createdAt");

ALTER TABLE "DispatchExceptionActionNote" ADD CONSTRAINT "DispatchExceptionActionNote_dispatchExceptionActionId_fkey" FOREIGN KEY ("dispatchExceptionActionId") REFERENCES "DispatchExceptionAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DispatchExceptionActionNote" ADD CONSTRAINT "DispatchExceptionActionNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
