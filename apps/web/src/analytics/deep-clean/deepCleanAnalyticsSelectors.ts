import type { DeepCleanAnalyticsRowDisplay } from "@/mappers/deepCleanAnalyticsMappers";

function varianceMinutesValue(m: number | null | undefined): number | null {
  if (m == null || !Number.isFinite(m)) return null;
  return m;
}

/**
 * Largest positive duration variances first (overruns). Rows with null variance sort last.
 */
export function getHighestOverrunRows(
  rows: DeepCleanAnalyticsRowDisplay[],
  count: number,
): DeepCleanAnalyticsRowDisplay[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const av = varianceMinutesValue(a.durationVarianceMinutes);
    const bv = varianceMinutesValue(b.durationVarianceMinutes);
    const aPos = av != null && av > 0 ? av : Number.NEGATIVE_INFINITY;
    const bPos = bv != null && bv > 0 ? bv : Number.NEGATIVE_INFINITY;
    if (bPos !== aPos) return bPos - aPos;
    return a.bookingId.localeCompare(b.bookingId);
  });
  return copy.slice(0, Math.max(0, count));
}

/**
 * Largest underruns (most negative variance minutes) first.
 */
export function getHighestUnderrunRows(
  rows: DeepCleanAnalyticsRowDisplay[],
  count: number,
): DeepCleanAnalyticsRowDisplay[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const av = varianceMinutesValue(a.durationVarianceMinutes);
    const bv = varianceMinutesValue(b.durationVarianceMinutes);
    const aNeg = av != null && av < 0 ? av : Number.POSITIVE_INFINITY;
    const bNeg = bv != null && bv < 0 ? bv : Number.POSITIVE_INFINITY;
    if (aNeg !== bNeg) return aNeg - bNeg;
    return a.bookingId.localeCompare(b.bookingId);
  });
  return copy.slice(0, Math.max(0, count));
}

export function rowNeedsReview(row: DeepCleanAnalyticsRowDisplay): boolean {
  return row.needsReview;
}

export function getRowsNeedingReview(
  rows: DeepCleanAnalyticsRowDisplay[],
): DeepCleanAnalyticsRowDisplay[] {
  const seen = new Set<string>();
  const out: DeepCleanAnalyticsRowDisplay[] = [];
  for (const r of rows) {
    if (!rowNeedsReview(r)) continue;
    if (seen.has(r.bookingId)) continue;
    seen.add(r.bookingId);
    out.push(r);
  }
  return out;
}

export function getUnreviewedRowsNeedingReview(
  rows: DeepCleanAnalyticsRowDisplay[],
): DeepCleanAnalyticsRowDisplay[] {
  return getRowsNeedingReview(rows.filter((r) => r.reviewStatus !== "reviewed"));
}

export function getReviewedRows(
  rows: DeepCleanAnalyticsRowDisplay[],
): DeepCleanAnalyticsRowDisplay[] {
  return rows.filter((r) => r.reviewStatus === "reviewed");
}
