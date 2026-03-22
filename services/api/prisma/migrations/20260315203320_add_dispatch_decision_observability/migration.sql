-- CreateEnum
CREATE TYPE "DispatchDecisionStatus" AS ENUM ('selected', 'no_candidates', 'all_excluded', 'deferred', 'already_applied');

-- CreateEnum
CREATE TYPE "DispatchCandidateStatus" AS ENUM ('considered', 'excluded', 'ranked', 'selected', 'rejected');

-- CreateEnum
CREATE TYPE "DispatchCandidateReasonCode" AS ENUM ('selected_best_score', 'not_selected_lower_rank', 'not_selected_after_competition', 'excluded_inactive', 'excluded_safety_hold', 'excluded_capacity', 'excluded_conflict', 'excluded_outside_service_area', 'excluded_no_matching_slot', 'excluded_job_type_mismatch', 'excluded_requirement_mismatch', 'excluded_provider_unavailable', 'excluded_duplicate_assignment', 'excluded_manual_block', 'excluded_unknown', 'redispatch_offer_expired', 'redispatch_assigned_start_sla', 'redispatch_manual', 'redispatch_system');

-- CreateTable
CREATE TABLE "DispatchDecision" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "bookingEventId" TEXT,
    "trigger" TEXT NOT NULL,
    "triggerDetail" TEXT,
    "dispatchSequence" INTEGER NOT NULL,
    "redispatchSequence" INTEGER NOT NULL DEFAULT 0,
    "decisionStatus" "DispatchDecisionStatus" NOT NULL,
    "selectedFranchiseOwnerId" TEXT,
    "selectedRank" INTEGER,
    "selectedScore" DECIMAL(10,4),
    "scoringVersion" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "correlationKey" TEXT,
    "bookingStatusAtDecision" "BookingStatus",
    "scheduledStart" TIMESTAMP(3),
    "estimatedDurationMin" INTEGER,
    "bookingSnapshot" JSONB NOT NULL,
    "decisionMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchDecisionCandidate" (
    "id" TEXT NOT NULL,
    "dispatchDecisionId" TEXT NOT NULL,
    "franchiseOwnerId" TEXT NOT NULL,
    "candidateStatus" "DispatchCandidateStatus" NOT NULL,
    "baseRank" INTEGER,
    "finalRank" INTEGER,
    "baseScore" DECIMAL(10,4),
    "finalScore" DECIMAL(10,4),
    "distanceMiles" DECIMAL(10,2),
    "foLoad" INTEGER,
    "acceptanceRate" DECIMAL(6,4),
    "completionRate" DECIMAL(6,4),
    "cancellationRate" DECIMAL(6,4),
    "acceptancePenalty" DECIMAL(10,4),
    "completionPenalty" DECIMAL(10,4),
    "cancellationPenalty" DECIMAL(10,4),
    "loadPenalty" DECIMAL(10,4),
    "reliabilityBonus" DECIMAL(10,4),
    "finalPenalty" DECIMAL(10,4),
    "reasonCode" "DispatchCandidateReasonCode",
    "reasonDetail" TEXT,
    "eligibilitySnapshot" JSONB,
    "scoreBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchDecisionCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispatchDecision_bookingId_createdAt_idx" ON "DispatchDecision"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchDecision_bookingId_dispatchSequence_idx" ON "DispatchDecision"("bookingId", "dispatchSequence");

-- CreateIndex
CREATE INDEX "DispatchDecision_selectedFranchiseOwnerId_idx" ON "DispatchDecision"("selectedFranchiseOwnerId");

-- CreateIndex
CREATE INDEX "DispatchDecision_decisionStatus_createdAt_idx" ON "DispatchDecision"("decisionStatus", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchDecisionCandidate_dispatchDecisionId_candidateStatu_idx" ON "DispatchDecisionCandidate"("dispatchDecisionId", "candidateStatus");

-- CreateIndex
CREATE INDEX "DispatchDecisionCandidate_franchiseOwnerId_createdAt_idx" ON "DispatchDecisionCandidate"("franchiseOwnerId", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchDecisionCandidate_reasonCode_createdAt_idx" ON "DispatchDecisionCandidate"("reasonCode", "createdAt");

-- AddForeignKey
ALTER TABLE "DispatchDecision" ADD CONSTRAINT "DispatchDecision_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchDecision" ADD CONSTRAINT "DispatchDecision_bookingEventId_fkey" FOREIGN KEY ("bookingEventId") REFERENCES "BookingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchDecisionCandidate" ADD CONSTRAINT "DispatchDecisionCandidate_dispatchDecisionId_fkey" FOREIGN KEY ("dispatchDecisionId") REFERENCES "DispatchDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchDecisionCandidate" ADD CONSTRAINT "DispatchDecisionCandidate_franchiseOwnerId_fkey" FOREIGN KEY ("franchiseOwnerId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
