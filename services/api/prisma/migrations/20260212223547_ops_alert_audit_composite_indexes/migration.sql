-- DropIndex
DROP INDEX "OpsAlertAudit_action_createdAt_idx";

-- DropIndex
DROP INDEX "OpsAlertAudit_eventId_idx";

-- DropIndex
DROP INDEX "OpsAlertAudit_sourceEventId_idx";

-- CreateIndex
CREATE INDEX "OpsAlertAudit_eventId_createdAt_idx" ON "OpsAlertAudit"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertAudit_sourceEventId_createdAt_idx" ON "OpsAlertAudit"("sourceEventId", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertAudit_fingerprint_action_createdAt_idx" ON "OpsAlertAudit"("fingerprint", "action", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertAudit_eventId_action_createdAt_idx" ON "OpsAlertAudit"("eventId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertAudit_sourceEventId_action_createdAt_idx" ON "OpsAlertAudit"("sourceEventId", "action", "createdAt");
