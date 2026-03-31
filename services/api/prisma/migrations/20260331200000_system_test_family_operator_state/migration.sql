-- CreateEnum
CREATE TYPE "SystemTestFamilyOperatorState" AS ENUM ('open', 'acknowledged', 'dismissed');

-- AlterTable
ALTER TABLE "SystemTestFailureFamily" ADD COLUMN     "operatorState" "SystemTestFamilyOperatorState" NOT NULL DEFAULT 'open',
ADD COLUMN     "operatorStateUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "operatorStateUpdatedById" TEXT,
ADD COLUMN     "operatorStateNote" TEXT;

-- AddForeignKey
ALTER TABLE "SystemTestFailureFamily" ADD CONSTRAINT "SystemTestFailureFamily_operatorStateUpdatedById_fkey" FOREIGN KEY ("operatorStateUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "SystemTestFailureFamily_operatorState_updatedAt_idx" ON "SystemTestFailureFamily"("operatorState", "updatedAt");
