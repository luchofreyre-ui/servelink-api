// adminPipeline.server.ts

import { buildAdminReviewPages } from "./adminPipeline";
import { getStoredReviewRecords } from "./reviewPersistence.server";
import { getAttachedEvidenceRecords } from "./evidenceAttachment.server";
import { getEditorialOverrides } from "./editorialOverride.server";
import { mergeAttachedEvidence } from "./evidenceAttachmentMerge";
import { evaluatePublishPolicyWithOverride } from "./publishPolicyWithOverride";
import { getEditorialNotesForSlug } from "./editorialNotes.server";
import { getRewriteTasksForSlug } from "./rewriteQueue.server";
import { getRepairCompletionForSlug } from "./repairCompletion.server";
import { getAttachedEvidenceForSlug } from "./evidenceAttachment.server";
import { getRepairHistory } from "./repairHistory.server";
import { getRewriteDraftsForSlug } from "./rewriteDraft.server";
import type { RewriteDraftRecord } from "./rewriteDraftTypes";
import { getRewriteApplicationsForSlug } from "./rewriteApplication.server";
import type { RewriteApplicationRecord } from "./rewriteApplicationTypes";
import { evaluateRepairReadiness } from "./repairReadiness";
import type { ReviewablePage } from "./renderTypes";

export function buildStoredAdminReviewPages(): ReviewablePage[] {
  const reviewRecords = getStoredReviewRecords();

  const attachedEvidence = getAttachedEvidenceRecords();
  const overrides = getEditorialOverrides();

  const pages = buildAdminReviewPages(reviewRecords);

  const attachedMap = new Map(
    attachedEvidence.map((record) => [record.slug, record.evidenceIds])
  );

  const overrideMap = new Map(overrides.map((record) => [record.slug, record]));

  const enrichedPages = pages.map((page) => {
    const mergedEvidence = mergeAttachedEvidence(
      page.evidence,
      attachedMap.get(page.slug)
    );

    const override = overrideMap.get(page.slug) ?? null;
    const pageForEval: ReviewablePage = {
      ...page,
      evidence: mergedEvidence,
      editorialOverrideMode: override?.mode ?? page.editorialOverrideMode,
      editorialOverrideNote: override?.note ?? page.editorialOverrideNote,
    };
    const evaluation = evaluatePublishPolicyWithOverride(pageForEval);

    const editorialNotes = getEditorialNotesForSlug(page.slug);
    const rewriteTasksRaw = getRewriteTasksForSlug(page.slug);
    const repairHistory = getRepairHistory(page.slug);
    const repairCompletion = getRepairCompletionForSlug(page.slug);
    const attachedEvidenceRecord = getAttachedEvidenceForSlug(page.slug);

    const openRewriteCount = rewriteTasksRaw.filter(
      (task) => task.status === "open"
    ).length;

    const completedRewriteCount = rewriteTasksRaw.filter(
      (task) => task.status === "completed"
    ).length;

    const attachedEvidenceCount = attachedEvidenceRecord?.evidenceIds.length ?? 0;

    const attachedEvidence = (attachedEvidenceRecord?.evidenceIds ?? []).map(
      (id) => ({ id })
    );

    const rewriteDrafts = getRewriteDraftsForSlug(page.slug);
    const openRewriteDraftCount = rewriteDrafts.length;

    const rewriteApplications = getRewriteApplicationsForSlug(page.slug);

    const repairReadiness = evaluateRepairReadiness({
      ...page,
      evidence: mergedEvidence,
      editorialOverrideMode: override?.mode,
      editorialOverrideNote: override?.note,
      editorialNotesCount: editorialNotes.length,
      openRewriteCount,
      completedRewriteCount,
      attachedEvidenceCount,
      repairCompletionStatus: repairCompletion?.status ?? "open",
      repairCompletionNote: repairCompletion?.note ?? null,
      openRewriteDraftCount,
      rewriteApplicationCount: rewriteApplications.length,
    } as ReviewablePage);

    return {
      ...page,
      evidence: mergedEvidence,
      publishPolicyPassed: evaluation.passed,
      publishFailureReasons: evaluation.reasons,
      editorialOverrideMode: override?.mode ?? page.editorialOverrideMode,
      editorialOverrideNote: override?.note ?? page.editorialOverrideNote,
      editorialNotes,
      rewriteTasks: rewriteTasksRaw.map((task) => ({
        id: task.id,
        section: task.section,
        sectionKey: task.section,
        reason: task.reason,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt,
      })),
      repairHistory: repairHistory.map((event) => ({
        id: event.id,
        type: event.type,
        createdAt: event.createdAt,
        metadata: event.metadata ?? {},
      })),
      attachedEvidence,
      editorialNotesCount: editorialNotes.length,
      openRewriteCount,
      completedRewriteCount,
      attachedEvidenceCount,
      repairCompletionStatus: repairCompletion?.status ?? "open",
      repairCompletionNote: repairCompletion?.note ?? null,
      rewriteDrafts: rewriteDrafts.map((draft: RewriteDraftRecord) => ({
        id: draft.id,
        taskId: draft.taskId,
        sectionKey: draft.sectionKey,
        draftText: draft.draftText,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      })),
      openRewriteDraftCount,
      rewriteApplications: rewriteApplications.map(
        (record: RewriteApplicationRecord) => ({
          id: record.id,
          taskId: record.taskId,
          sectionKey: record.sectionKey,
          appliedText: record.appliedText,
          appliedAt: record.appliedAt,
        })
      ),
      rewriteApplicationCount: rewriteApplications.length,
      repairReadiness: repairReadiness.readiness,
      repairReadinessReasons: repairReadiness.reasons,
    };
  });

  return enrichedPages;
}
