-- CreateIndex
CREATE INDEX "OpsAlert_assignedToAdminId_status_lastSeenAt_idx" ON "OpsAlert"("assignedToAdminId", "status", "lastSeenAt");

-- CreateIndex
CREATE INDEX "OpsAlert_lastSeenAt_idx" ON "OpsAlert"("lastSeenAt");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_assignedToAdminId_status_lastSeenAt_idx" ON "OpsAlertRollup"("assignedToAdminId", "status", "lastSeenAt");

-- CreateIndex
CREATE INDEX "OpsAlertRollup_lastSeenAt_idx" ON "OpsAlertRollup"("lastSeenAt");
