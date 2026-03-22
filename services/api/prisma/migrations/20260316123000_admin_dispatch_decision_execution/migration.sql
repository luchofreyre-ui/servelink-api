-- CreateEnum
CREATE TYPE "AdminDispatchDecisionExecutionStatus" AS ENUM ('pending', 'executing', 'applied', 'rejected', 'failed');

-- AlterTable
ALTER TABLE "AdminDispatchDecision" ADD COLUMN "executionStatus" "AdminDispatchDecisionExecutionStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "AdminDispatchDecision" ADD COLUMN "executionMessage" TEXT;
ALTER TABLE "AdminDispatchDecision" ADD COLUMN "executionErrorCode" TEXT;
ALTER TABLE "AdminDispatchDecision" ADD COLUMN "executionAttemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminDispatchDecision" ADD COLUMN "executionStartedAt" TIMESTAMP(3);
ALTER TABLE "AdminDispatchDecision" ADD COLUMN "executedAt" TIMESTAMP(3);
ALTER TABLE "AdminDispatchDecision" ADD COLUMN "executionIdempotencyKey" TEXT;

-- CreateIndex
CREATE INDEX "AdminDispatchDecision_executionStatus_createdAt_idx" ON "AdminDispatchDecision"("executionStatus", "createdAt");
