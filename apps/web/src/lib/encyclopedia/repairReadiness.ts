import type { ReviewablePage } from "./renderTypes";
import type { RepairReadinessSummary } from "./repairReadinessTypes";

export function evaluateRepairReadiness(
  page: ReviewablePage
): RepairReadinessSummary {
  const reasons: string[] = [];

  if ((page.attachedEvidenceCount ?? 0) === 0) {
    reasons.push("no_attached_evidence");
  }

  if (
    (page.openRewriteCount ?? 0) > 0 &&
    (page.openRewriteDraftCount ?? 0) === 0
  ) {
    reasons.push("open_rewrites_without_drafts");
  }

  if (page.repairCompletionStatus !== "completed") {
    reasons.push("repair_not_completed");
  }

  return {
    slug: page.slug,
    readiness: reasons.length === 0 ? "ready" : "not_ready",
    reasons,
  };
}
