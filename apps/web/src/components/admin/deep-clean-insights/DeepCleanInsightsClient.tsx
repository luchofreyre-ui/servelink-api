"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildDeepCleanInsightsFingerprint } from "@/analytics/deep-clean/deepCleanInsightsInterpretation";
import { getTopReasonTags } from "@/analytics/deep-clean/deepCleanInsightsSelectors";
import { fetchAdminDeepCleanInsights } from "@/lib/api/bookings";
import { getStoredAccessToken } from "@/lib/auth";
import {
  mapDeepCleanInsightsSummaryApiToDisplay,
  mapFeedbackBucketApiToDisplay,
  mapProgramTypeInsightRowApiToDisplay,
  mapReasonTagInsightRowApiToDisplay,
} from "@/mappers/deepCleanInsightsMappers";
import type {
  DeepCleanFeedbackBucketDisplay,
  DeepCleanInsightsSummaryDisplay,
  DeepCleanProgramTypeInsightRowDisplay,
  DeepCleanReasonTagInsightRowDisplay,
} from "@/mappers/deepCleanInsightsMappers";
import type { DeepCleanInsightsResponseApi } from "@/types/deepCleanInsights";
import { DeepCleanInsightsFilters, DEFAULT_DEEP_CLEAN_INSIGHTS_FILTERS } from "./DeepCleanInsightsFilters";
import type { DeepCleanInsightsFilterState } from "./DeepCleanInsightsFilters";
import { DeepCleanInsightsInterpretationBlock } from "./DeepCleanInsightsInterpretationBlock";
import { DeepCleanInsightsSummaryCards } from "./DeepCleanInsightsSummaryCards";

function fmtNum(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return String(n);
}

export function DeepCleanInsightsClient() {
  const [filters, setFilters] = useState<DeepCleanInsightsFilterState>(
    DEFAULT_DEEP_CLEAN_INSIGHTS_FILTERS,
  );
  const [summary, setSummary] = useState<DeepCleanInsightsSummaryDisplay | null>(null);
  const [reasonRows, setReasonRows] = useState<DeepCleanReasonTagInsightRowDisplay[]>([]);
  const [programRows, setProgramRows] = useState<DeepCleanProgramTypeInsightRowDisplay[]>([]);
  const [buckets, setBuckets] = useState<DeepCleanFeedbackBucketDisplay[]>([]);
  const [rawPayload, setRawPayload] = useState<DeepCleanInsightsResponseApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: DeepCleanInsightsFilterState) => {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in at /admin/auth with an admin account.");
      setSummary(null);
      setReasonRows([]);
      setProgramRows([]);
      setBuckets([]);
      setRawPayload(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminDeepCleanInsights({
        reviewedOnly: f.reviewedOnly ? undefined : false,
        programType: f.programType || undefined,
        reasonTag: f.reasonTag || undefined,
        feedbackBucket: f.feedbackBucket || undefined,
      });
      setRawPayload(res);
      setSummary(mapDeepCleanInsightsSummaryApiToDisplay(res.summary));
      setReasonRows(res.reasonTagRows.map(mapReasonTagInsightRowApiToDisplay));
      setProgramRows(res.programTypeRows.map(mapProgramTypeInsightRowApiToDisplay));
      setBuckets(res.feedbackBuckets.map(mapFeedbackBucketApiToDisplay));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load insights.");
      setSummary(null);
      setReasonRows([]);
      setProgramRows([]);
      setBuckets([]);
      setRawPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filters);
  }, [load, filters]);

  const fingerprint = useMemo(() => {
    if (!summary) {
      return buildDeepCleanInsightsFingerprint({
        summary: {
          totalReviewedPrograms: 0,
          reviewedEstimatorIssuePrograms: 0,
          reviewedOperationalIssuePrograms: 0,
          reviewedScopeIssuePrograms: 0,
          averageReviewedVarianceMinutes: null,
          averageReviewedVariancePercent: null,
        },
        feedbackBuckets: [],
        reasonTagRows: [],
        programTypeRows: [],
      });
    }
    return buildDeepCleanInsightsFingerprint({
      summary,
      feedbackBuckets: buckets.map((b) => ({ bucket: b.bucket, count: b.count })),
      reasonTagRows: reasonRows,
      programTypeRows: programRows,
    });
  }, [summary, buckets, reasonRows, programRows]);

  const topReasons = useMemo(() => getTopReasonTags(reasonRows, 12), [reasonRows]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Deep Clean Insights</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Aggregated patterns from reviewed program calibrations only (
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
            GET /api/v1/admin/deep-clean/insights
          </code>
          ). For booking-level follow-up use{" "}
          <Link
            href="/admin/deep-clean/analytics"
            className="font-medium text-blue-700 underline"
            data-testid="deep-clean-insights-link-analytics"
          >
            Deep Clean Analytics
          </Link>
          .
        </p>
        <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <Link href="/admin" className="text-blue-700 hover:underline">
            Admin home
          </Link>
          <Link href="/admin/deep-clean/analytics" className="text-blue-700 hover:underline">
            Deep Clean Analytics
          </Link>
          <Link href="/admin/deep-clean/estimator" className="text-blue-700 hover:underline">
            Deep Clean Estimator
          </Link>
          <Link
            href="/admin/deep-clean/estimator-impact"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-insights-link-estimator-impact"
          >
            Estimator impact
          </Link>
        </p>
      </div>

      <DeepCleanInsightsFilters value={filters} onChange={setFilters} disabled={loading} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}

      {!loading && summary ? (
        <>
          <DeepCleanInsightsSummaryCards summary={summary} />
          <DeepCleanInsightsInterpretationBlock fingerprint={fingerprint} />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Feedback buckets</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {buckets.map((b) => (
                <div
                  key={b.bucket}
                  data-testid={`deep-clean-insights-bucket-${b.bucket}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-medium text-slate-800">{b.bucketLabel}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{b.count}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Top review reasons</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-3 py-3">Tag</th>
                    <th className="px-3 py-3">Reviewed count</th>
                    <th className="px-3 py-3">Avg variance %</th>
                    <th className="px-3 py-3">Avg variance (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {topReasons.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={4}>
                        No reviewed reason tags in this filter.
                      </td>
                    </tr>
                  ) : (
                    topReasons.map((r) => (
                      <tr key={r.reasonTag} className="border-b border-slate-100">
                        <td className="px-3 py-2">{r.reasonTagLabel}</td>
                        <td className="px-3 py-2">{r.reviewedCount}</td>
                        <td className="px-3 py-2">
                          {r.averageVariancePercent != null ? `${r.averageVariancePercent}%` : "—"}
                        </td>
                        <td className="px-3 py-2">{fmtNum(r.averageVarianceMinutes)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Program type comparison</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-3 py-3">Program type</th>
                    <th className="px-3 py-3">Reviewed count</th>
                    <th className="px-3 py-3">Usable count</th>
                    <th className="px-3 py-3">Avg variance %</th>
                    <th className="px-3 py-3">Avg variance (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {programRows.map((r) => (
                    <tr key={r.programType} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-medium">{r.programTypeLabel}</td>
                      <td className="px-3 py-2">{r.reviewedCount}</td>
                      <td className="px-3 py-2">{r.usableCount}</td>
                      <td className="px-3 py-2">
                        {r.averageVariancePercent != null ? `${r.averageVariancePercent}%` : "—"}
                      </td>
                      <td className="px-3 py-2">{fmtNum(r.averageVarianceMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
