"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchAdminDeepCleanAnalytics } from "@/lib/api/bookings";
import { getStoredAccessToken } from "@/lib/auth";
import {
  mapDeepCleanAnalyticsRowsApiToDisplay,
  mapDeepCleanAnalyticsSummaryApiToDisplay,
  type DeepCleanAnalyticsRowDisplay,
  type DeepCleanAnalyticsSummaryDisplay,
} from "@/mappers/deepCleanAnalyticsMappers";
import { DeepCleanAnalyticsSummaryCards } from "./DeepCleanAnalyticsSummaryCards";
import {
  DeepCleanAnalyticsFilters,
  DEFAULT_DEEP_CLEAN_ANALYTICS_FILTERS,
  type DeepCleanAnalyticsFilterState,
} from "./DeepCleanAnalyticsFilters";
import { DeepCleanAnalyticsNeedsReview } from "./DeepCleanAnalyticsNeedsReview";
import { DeepCleanAnalyticsReviewModal } from "./DeepCleanAnalyticsReviewModal";
import { DeepCleanAnalyticsTable } from "./DeepCleanAnalyticsTable";

export function DeepCleanAnalyticsClient() {
  const [filters, setFilters] = useState<DeepCleanAnalyticsFilterState>(
    DEFAULT_DEEP_CLEAN_ANALYTICS_FILTERS,
  );
  const [summary, setSummary] = useState<DeepCleanAnalyticsSummaryDisplay | null>(null);
  const [rows, setRows] = useState<DeepCleanAnalyticsRowDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRow, setReviewRow] = useState<DeepCleanAnalyticsRowDisplay | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const load = useCallback(async (f: DeepCleanAnalyticsFilterState) => {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in at /admin/auth with an admin account.");
      setSummary(null);
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminDeepCleanAnalytics({
        usableOnly: f.usableOnly ? true : undefined,
        withOperatorNotesOnly: f.withOperatorNotesOnly ? true : undefined,
        fullyCompletedOnly: f.fullyCompletedOnly ? true : undefined,
        programType: f.programType || undefined,
        sortBy: f.sortBy,
        limit: f.limit,
        reviewStatus:
          f.reviewFilter === "reviewed"
            ? "reviewed"
            : f.reviewFilter === "unreviewed"
              ? "unreviewed"
              : undefined,
        reasonTag: f.reasonTag || undefined,
      });
      setSummary(mapDeepCleanAnalyticsSummaryApiToDisplay(res.summary));
      setRows(mapDeepCleanAnalyticsRowsApiToDisplay(res.rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deep clean analytics.");
      setSummary(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filters);
  }, [load, filters]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Deep Clean Analytics</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Read-only operational view from persisted program calibration records (
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
            GET /api/v1/admin/deep-clean/analytics
          </code>
          ). Open a booking for full calibration and execution detail.
        </p>
        <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <Link href="/admin" className="text-blue-700 hover:underline">
            Admin home
          </Link>
          <Link
            href="/admin/deep-clean/insights"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-analytics-link-insights"
          >
            Deep Clean Insights
          </Link>
          <Link
            href="/admin/deep-clean/estimator"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-analytics-link-estimator"
          >
            Deep Clean Estimator
          </Link>
          <Link
            href="/admin/deep-clean/estimator-impact"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-analytics-link-estimator-impact"
          >
            Estimator impact
          </Link>
        </p>
      </div>

      <DeepCleanAnalyticsFilters value={filters} onChange={setFilters} disabled={loading} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}

      {!loading && summary ? (
        <>
          <DeepCleanAnalyticsSummaryCards summary={summary} />
          <DeepCleanAnalyticsNeedsReview rows={rows} />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Calibrated bookings</h2>
            <DeepCleanAnalyticsTable
              rows={rows}
              onReviewRow={(r) => {
                setReviewRow(r);
                setReviewOpen(true);
              }}
            />
          </section>
        </>
      ) : null}

      <DeepCleanAnalyticsReviewModal
        open={reviewOpen}
        row={reviewRow}
        onClose={() => {
          setReviewOpen(false);
          setReviewRow(null);
        }}
        onSaved={() => void load(filters)}
      />
    </div>
  );
}
