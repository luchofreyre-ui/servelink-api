-- CreateEnum
CREATE TYPE "OpsAlertSeverity" AS ENUM ('info', 'warning', 'critical');

-- AlterTable
ALTER TABLE "OpsAlert" ADD COLUMN     "assignedToAdminId" TEXT,
ADD COLUMN     "fingerprint" TEXT,
ADD COLUMN     "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "occurrences" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "resolveNote" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedByAdminId" TEXT,
ADD COLUMN     "severity" "OpsAlertSeverity" NOT NULL DEFAULT 'warning';

-- CreateIndex
CREATE INDEX "OpsAlert_severity_createdAt_idx" ON "OpsAlert"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlert_fingerprint_idx" ON "OpsAlert"("fingerprint");

-- CreateIndex
CREATE INDEX "OpsAlert_assignedToAdminId_status_createdAt_idx" ON "OpsAlert"("assignedToAdminId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "OpsAlert_status_lastSeenAt_idx" ON "OpsAlert"("status", "lastSeenAt");
