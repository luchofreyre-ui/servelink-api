-- Phase 11A: SLA + automation event types + action columns

ALTER TYPE "SystemTestIncidentEventType" ADD VALUE 'sla_started';
ALTER TYPE "SystemTestIncidentEventType" ADD VALUE 'sla_due_soon';
ALTER TYPE "SystemTestIncidentEventType" ADD VALUE 'sla_overdue';
ALTER TYPE "SystemTestIncidentEventType" ADD VALUE 'escalation_ready';
ALTER TYPE "SystemTestIncidentEventType" ADD VALUE 'notification_queued';

ALTER TABLE "SystemTestIncidentAction" ADD COLUMN "slaPolicyHours" INTEGER;
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN "slaStartedAt" TIMESTAMP(3);
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN "slaDueAt" TIMESTAMP(3);
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN "slaStatus" TEXT;
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN "slaLastEvaluatedAt" TIMESTAMP(3);
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN "slaDueSoonNotifiedAt" TIMESTAMP(3);
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN "slaOverdueNotifiedAt" TIMESTAMP(3);
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN "escalationReadyAt" TIMESTAMP(3);
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN "lastNotificationQueuedAt" TIMESTAMP(3);

CREATE INDEX "SystemTestIncidentAction_slaStatus_idx" ON "SystemTestIncidentAction"("slaStatus");
CREATE INDEX "SystemTestIncidentAction_slaDueAt_idx" ON "SystemTestIncidentAction"("slaDueAt");
CREATE INDEX "SystemTestIncidentAction_escalationReadyAt_idx" ON "SystemTestIncidentAction"("escalationReadyAt");
