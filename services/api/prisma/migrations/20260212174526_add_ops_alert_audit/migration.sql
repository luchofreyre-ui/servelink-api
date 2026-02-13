-- CreateTable
CREATE TABLE "OpsAlertAudit" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "OpsAlertStatus",
    "toStatus" "OpsAlertStatus",
    "fromSeverity" "OpsAlertSeverity",
    "toSeverity" "OpsAlertSeverity",
    "fromAssignedToAdminId" TEXT,
    "toAssignedToAdminId" TEXT,
    "actorAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsAlertAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpsAlertAudit_fingerprint_createdAt_idx" ON "OpsAlertAudit"("fingerprint", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlertAudit_action_createdAt_idx" ON "OpsAlertAudit"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "OpsAlertAudit" ADD CONSTRAINT "OpsAlertAudit_fingerprint_fkey" FOREIGN KEY ("fingerprint") REFERENCES "OpsAlertRollup"("fingerprint") ON DELETE CASCADE ON UPDATE CASCADE;
