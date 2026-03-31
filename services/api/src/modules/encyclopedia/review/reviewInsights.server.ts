import { getAllReviewRecords } from "./reviewStore.server";

export function getValidationInsights() {
  const records = getAllReviewRecords();

  const errorCounts: Record<string, number> = {};
  const slugFailures: Record<string, string[]> = {};

  for (const r of records) {
    if (!r.promotionErrors?.length) continue;

    slugFailures[r.slug] = r.promotionErrors;

    for (const err of r.promotionErrors) {
      errorCounts[err] = (errorCounts[err] || 0) + 1;
    }
  }

  const sorted = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([error, count]) => ({ error, count }));

  return {
    totalFailures: Object.keys(slugFailures).length,
    topErrors: sorted.slice(0, 10),
    allErrors: sorted,
    slugFailures,
  };
}
