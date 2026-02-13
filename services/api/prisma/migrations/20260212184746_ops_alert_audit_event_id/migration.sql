-- AlterTable
ALTER TABLE "OpsAlertAudit" ADD COLUMN     "eventId" TEXT;

-- CreateIndex
CREATE INDEX "OpsAlertAudit_eventId_idx" ON "OpsAlertAudit"("eventId");
