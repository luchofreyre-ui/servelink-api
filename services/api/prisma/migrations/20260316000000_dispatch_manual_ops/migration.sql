-- Add enum values for admin dispatch manual ops
ALTER TYPE "DispatchDecisionStatus"
ADD VALUE IF NOT EXISTS 'manual_assigned';

ALTER TYPE "DispatchCandidateReasonCode"
ADD VALUE IF NOT EXISTS 'excluded_manual_block';
