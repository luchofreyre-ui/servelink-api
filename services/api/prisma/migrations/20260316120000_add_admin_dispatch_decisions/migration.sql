-- CreateEnum
CREATE TYPE "AdminDispatchDecisionAction" AS ENUM (
  'approve_assignment',
  'reassign',
  'hold',
  'escalate',
  'request_review'
);

-- CreateTable
CREATE TABLE "AdminDispatchDecision" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "action" "AdminDispatchDecisionAction" NOT NULL,
    "rationale" TEXT NOT NULL,
    "targetFoId" TEXT,
    "submittedByUserId" TEXT NOT NULL,
    "submittedByRole" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminDispatchDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminDispatchDecision_bookingId_createdAt_idx" ON "AdminDispatchDecision"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminDispatchDecision_submittedByUserId_createdAt_idx" ON "AdminDispatchDecision"("submittedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminDispatchDecision_action_createdAt_idx" ON "AdminDispatchDecision"("action", "createdAt");
