-- AlterTable
ALTER TABLE "OpsAlert" ADD COLUMN     "slaBreachedAt" TIMESTAMP(3),
ADD COLUMN     "slaDueAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "OpsAlert_status_slaDueAt_idx" ON "OpsAlert"("status", "slaDueAt");
