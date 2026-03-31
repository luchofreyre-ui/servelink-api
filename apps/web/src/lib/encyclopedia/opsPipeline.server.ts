// opsPipeline.server.ts

import { buildStoredAdminReviewPages } from "./adminPipeline.server";
import { buildEncyclopediaThroughputCounts } from "./encyclopediaThroughputMetrics.server";
import { getPublishQueueRecords } from "./publishQueue.server";
import { buildOpsMetrics } from "./opsMetrics";
import { buildWeakPageRepairWorkflow } from "./repairWorkflow.server";

export function buildEncyclopediaOpsSnapshot() {
  const pages = buildStoredAdminReviewPages();
  const queue = getPublishQueueRecords();
  const metrics = buildOpsMetrics(pages, queue);
  const throughput = buildEncyclopediaThroughputCounts();
  const weakPages = buildWeakPageRepairWorkflow();

  const completedRepairsCount = pages.filter(
    (p) => p.repairCompletionStatus === "completed"
  ).length;

  const openRewritesLeaderboard = [...pages]
    .map((p) => ({
      slug: p.slug,
      openRewriteCount: p.openRewriteCount ?? 0,
    }))
    .filter((p) => p.openRewriteCount > 0)
    .sort((a, b) => b.openRewriteCount - a.openRewriteCount)
    .slice(0, 8);

  const pagesWithNotesCount = weakPages.filter(
    (page) => (page.editorialNotesCount ?? 0) > 0
  ).length;

  const completedRepairsLeaderboard = [...weakPages]
    .filter((page) => page.repairCompletionStatus === "completed")
    .sort((a, b) => {
      const evidenceDelta =
        (b.attachedEvidenceCount ?? 0) - (a.attachedEvidenceCount ?? 0);
      if (evidenceDelta !== 0) return evidenceDelta;

      return a.slug.localeCompare(b.slug);
    })
    .slice(0, 8)
    .map((page) => ({
      slug: page.slug,
      attachedEvidenceCount: page.attachedEvidenceCount ?? 0,
      openRewriteCount: page.openRewriteCount ?? 0,
    }));

  const pagesWithRewriteDraftsCount = weakPages.filter(
    (page) => (page.openRewriteDraftCount ?? 0) > 0
  ).length;

  const rewriteDraftLeaderboard = [...weakPages]
    .filter((page) => (page.openRewriteDraftCount ?? 0) > 0)
    .sort((a, b) => {
      const draftDelta =
        (b.openRewriteDraftCount ?? 0) - (a.openRewriteDraftCount ?? 0);
      if (draftDelta !== 0) return draftDelta;

      return a.slug.localeCompare(b.slug);
    })
    .slice(0, 8)
    .map((page) => ({
      slug: page.slug,
      openRewriteDraftCount: page.openRewriteDraftCount ?? 0,
      openRewriteCount: page.openRewriteCount ?? 0,
    }));

  const appliedRewritesCount = weakPages.reduce(
    (sum, page) => sum + (page.rewriteApplicationCount ?? 0),
    0
  );

  const rewriteApplicationsLeaderboard = [...weakPages]
    .filter((page) => (page.rewriteApplicationCount ?? 0) > 0)
    .sort((a, b) => {
      const delta =
        (b.rewriteApplicationCount ?? 0) - (a.rewriteApplicationCount ?? 0);
      if (delta !== 0) return delta;
      return a.slug.localeCompare(b.slug);
    })
    .slice(0, 8)
    .map((page) => ({
      slug: page.slug,
      rewriteApplicationCount: page.rewriteApplicationCount ?? 0,
      openRewriteDraftCount: page.openRewriteDraftCount ?? 0,
      openRewriteCount: page.openRewriteCount ?? 0,
    }));

  const readyForApprovalCount = weakPages.filter(
    (page) => page.repairReadiness === "ready"
  ).length;

  const notReadyForApprovalCount = weakPages.filter(
    (page) => page.repairReadiness !== "ready"
  ).length;

  const repairReadinessLeaderboard = [...weakPages]
    .filter((page) => page.repairReadiness !== "ready")
    .sort((a, b) => {
      const aReasons = a.repairReadinessReasons?.length ?? 0;
      const bReasons = b.repairReadinessReasons?.length ?? 0;
      if (bReasons !== aReasons) return bReasons - aReasons;
      return a.slug.localeCompare(b.slug);
    })
    .slice(0, 8)
    .map((page) => ({
      slug: page.slug,
      reasons: page.repairReadinessReasons ?? [],
    }));

  const batchActionEligibleCount = weakPages.filter(
    (page) =>
      page.repairCompletionStatus !== "completed" ||
      (page.attachedEvidenceCount ?? 0) === 0 ||
      (page.editorialNotesCount ?? 0) === 0
  ).length;

  return {
    pages,
    queue,
    metrics,
    throughput,
    weakPages,
    completedRepairsCount,
    openRewritesLeaderboard,
    pagesWithNotesCount,
    completedRepairsLeaderboard,
    pagesWithRewriteDraftsCount,
    rewriteDraftLeaderboard,
    appliedRewritesCount,
    rewriteApplicationsLeaderboard,
    readyForApprovalCount,
    notReadyForApprovalCount,
    repairReadinessLeaderboard,
    batchActionEligibleCount,
  };
}
