// repairWorkflow.server.ts

import { buildStoredAdminReviewPages } from "./adminPipeline.server";
import { buildRemediationPlan } from "./remediationPlanner";
import { getSuggestedEvidenceForWeakPage } from "./evidenceEnrichment";
import type { WeakPageRepairRecord } from "./repairWorkflowTypes";

export function buildWeakPageRepairWorkflow(): WeakPageRepairRecord[] {
  const pages = buildStoredAdminReviewPages();

  return pages
    .filter((page) => !page.publishPolicyPassed)
    .map((page) => ({
      slug: page.slug,
      title: page.title,
      reviewStatus: page.reviewStatus,
      riskLevel: page.riskLevel,
      qualityOverall: page.qualityScore?.overall ?? 0,
      publishPolicyPassed: Boolean(page.publishPolicyPassed),
      publishFailureReasons: page.publishFailureReasons ?? [],
      remediationPlan: buildRemediationPlan(page),
      evidenceEnrichment: getSuggestedEvidenceForWeakPage(page),
      editorialNotes: page.editorialNotes ?? [],
      rewriteTasks: page.rewriteTasks ?? [],
      repairHistory: page.repairHistory ?? [],
      attachedEvidence: page.attachedEvidence ?? [],
      rewriteDrafts: page.rewriteDrafts ?? [],
      openRewriteDraftCount: page.openRewriteDraftCount ?? 0,
      rewriteApplications: page.rewriteApplications ?? [],
      rewriteApplicationCount: page.rewriteApplicationCount ?? 0,
      editorialNotesCount: page.editorialNotesCount ?? 0,
      openRewriteCount: page.openRewriteCount ?? 0,
      completedRewriteCount: page.completedRewriteCount ?? 0,
      attachedEvidenceCount: page.attachedEvidenceCount ?? 0,
      repairCompletionStatus: page.repairCompletionStatus ?? "open",
      repairCompletionNote: page.repairCompletionNote ?? null,
      editorialOverrideMode: page.editorialOverrideMode,
      editorialOverrideNote: page.editorialOverrideNote,
      repairReadiness: page.repairReadiness ?? "not_ready",
      repairReadinessReasons: page.repairReadinessReasons ?? [],
    }))
    .sort((a, b) => {
      if (a.riskLevel !== b.riskLevel) {
        const riskRank = { high: 0, medium: 1, low: 2 };
        return riskRank[a.riskLevel] - riskRank[b.riskLevel];
      }

      return a.qualityOverall - b.qualityOverall;
    });
}
