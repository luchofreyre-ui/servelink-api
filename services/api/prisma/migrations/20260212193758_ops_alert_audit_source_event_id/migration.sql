-- AlterTable
ALTER TABLE "OpsAlertAudit" ADD COLUMN     "sourceEventId" TEXT;

-- CreateIndex
CREATE INDEX "OpsAlertAudit_sourceEventId_idx" ON "OpsAlertAudit"("sourceEventId");
