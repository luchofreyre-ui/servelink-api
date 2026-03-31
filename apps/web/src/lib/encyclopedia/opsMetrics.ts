// opsMetrics.ts

import type { ReviewablePage, ReviewStatus } from "./renderTypes";
import type { PublishQueueRecord } from "./publishQueueTypes";

export type OpsMetrics = {
  totalPages: number;
  byReviewStatus: Record<ReviewStatus, number>;
  byRiskLevel: Record<"low" | "medium" | "high", number>;
  approvedPages: number;
  queuedPages: number;
  publishedPages: number;
  failedPages: number;
  policyPassedPages: number;
  policyFailedPages: number;
};

export function buildOpsMetrics(
  pages: ReviewablePage[],
  queue: PublishQueueRecord[]
): OpsMetrics {
  const byReviewStatus: Record<ReviewStatus, number> = {
    draft: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0,
  };

  const byRiskLevel: Record<"low" | "medium" | "high", number> = {
    low: 0,
    medium: 0,
    high: 0,
  };

  let policyPassedPages = 0;
  let policyFailedPages = 0;

  for (const page of pages) {
    byReviewStatus[page.reviewStatus] += 1;
    byRiskLevel[page.riskLevel] += 1;

    if (page.publishPolicyPassed) {
      policyPassedPages += 1;
    } else {
      policyFailedPages += 1;
    }
  }

  const queuedPages = queue.filter((r) => r.status === "queued").length;
  const publishedPages = queue.filter((r) => r.status === "published").length;
  const failedPages = queue.filter((r) => r.status === "failed").length;

  return {
    totalPages: pages.length,
    byReviewStatus,
    byRiskLevel,
    approvedPages: byReviewStatus.approved,
    queuedPages,
    publishedPages,
    failedPages,
    policyPassedPages,
    policyFailedPages,
  };
}
