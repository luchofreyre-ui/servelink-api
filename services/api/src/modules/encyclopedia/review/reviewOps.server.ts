import { getAllReviewRecords } from "./reviewStore.server";

export function getReviewOpsSummary() {
  const records = getAllReviewRecords();

  const summary = {
    total: records.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    live: 0,
    failed: 0,
  };

  for (const r of records) {
    if (r.reviewStatus === "pending") summary.pending++;
    if (r.reviewStatus === "approved") summary.approved++;
    if (r.reviewStatus === "rejected") summary.rejected++;

    if (r.publishStatus === "live") summary.live++;
    if (r.publishStatus === "failed") summary.failed++;
  }

  return summary;
}
