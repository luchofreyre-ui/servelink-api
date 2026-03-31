import type { CanonicalPageSnapshot } from "../canonical/canonicalTypes";
import {
  markReviewApproved,
  markReviewRejected,
} from "./reviewStore.server";
import { buildGenerationFeedback } from "../ingestion/generationFeedback.server";
import {
  promoteApprovedReviewRecords,
  retryFailedPromotions,
} from "./reviewPromotion.server";
import { importReviewRecordsFromFile } from "./reviewImport.server";
import {
  batchUpsertGeneratedReviewRecords,
  upsertGeneratedReviewRecord,
} from "./reviewIntake.server";
import {
  type ReviewedCandidateInput,
  saveReviewedCandidatesToApiStore,
} from "./reviewedCandidatesIntake.server";

export async function approveReview(slug: string) {
  markReviewApproved(slug);
  return { success: true };
}

export async function rejectReview(slug: string) {
  markReviewRejected(slug);
  return { success: true };
}

export async function promoteApproved() {
  return await promoteApprovedReviewRecords();
}

export async function retryFailed() {
  return await retryFailedPromotions();
}

export async function importReviewRecords() {
  return importReviewRecordsFromFile();
}

export async function getGenerationFeedbackAction() {
  return buildGenerationFeedback();
}

export async function createGeneratedReviewRecord(
  snapshot: CanonicalPageSnapshot,
) {
  return upsertGeneratedReviewRecord(snapshot);
}

export async function createGeneratedReviewRecords(
  snapshots: CanonicalPageSnapshot[],
) {
  return batchUpsertGeneratedReviewRecords(snapshots);
}

export async function intakeReviewedCandidates(
  inputs: ReviewedCandidateInput[],
) {
  return saveReviewedCandidatesToApiStore(inputs);
}
