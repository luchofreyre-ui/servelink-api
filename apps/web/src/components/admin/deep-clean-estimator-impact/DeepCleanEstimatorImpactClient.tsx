"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getBestVersionByVariance,
  getDominantUnderOverPattern,
  getLatestVersion,
  getMostRecentComparison,
  getWorstVersionByVariance,
} from "@/analytics/deep-clean/deepCleanEstimatorImpactSelectors";
import { fetchAdminDeepCleanEstimatorImpact } from "@/lib/api/bookings";
import { getStoredAccessToken } from "@/lib/auth";
import {
  mapEstimatorImpactComparisonApiToDisplay,
  mapEstimatorImpactRowApiToDisplay,
  type DeepCleanEstimatorVersionComparisonDisplay,
  type DeepCleanEstimatorVersionImpactRowDisplay,
} from "@/mappers/deepCleanEstimatorImpactMappers";
import {
  DeepCleanEstimatorImpactFilters,
  DEFAULT_DEEP_CLEAN_ESTIMATOR_IMPACT_FILTERS,
  type DeepCleanEstimatorImpactFilterState,
} from "./DeepCleanEstimatorImpactFilters";

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return String(n);
}

function directionBadgeClass(d: DeepCleanEstimatorVersionComparisonDisplay["variancePercentDirection"]): string {
  if (d === "improved") return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (d === "worsened") return "bg-rose-100 text-rose-900 border-rose-200";
  return "bg-slate-100 text-slate-800 border-slate-200";
}

export function DeepCleanEstimatorImpactClient() {
  const [filters, setFilters] = useState<DeepCleanEstimatorImpactFilterState>(
    DEFAULT_DEEP_CLEAN_ESTIMATOR_IMPACT_FILTERS,
  );
  const [rowDisplays, setRowDisplays] = useState<DeepCleanEstimatorVersionImpactRowDisplay[]>([]);
  const [comparisonDisplays, setComparisonDisplays] = useState<DeepCleanEstimatorVersionComparisonDisplay[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: DeepCleanEstimatorImpactFilterState) => {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in at /admin/auth with an admin account.");
      setRowDisplays([]);
      setComparisonDisplays([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const limRaw = f.limit.trim();
      const limParsed = limRaw === "" ? undefined : parseInt(limRaw, 10);
      const limit =
        limParsed != null && Number.isFinite(limParsed) && limParsed > 0 ? limParsed : undefined;

      const res = await fetchAdminDeepCleanEstimatorImpact({
        reviewedOnly: f.reviewedOnly ? undefined : false,
        usableOnly: f.usableOnly ? undefined : false,
        programType: f.programType || undefined,
        version: f.version.trim() || undefined,
        limit,
      });
      setRowDisplays(res.rows.map(mapEstimatorImpactRowApiToDisplay));
      setComparisonDisplays(res.comparisons.map(mapEstimatorImpactComparisonApiToDisplay));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load estimator impact.");
      setRowDisplays([]);
      setComparisonDisplays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const v = q.get("version");
    if (v) {
      setFilters((prev) => (prev.version === v ? prev : { ...prev, version: v }));
    }
  }, []);

  useEffect(() => {
    void load(filters);
  }, [load, filters]);

  const best = useMemo(() => getBestVersionByVariance(rowDisplays), [rowDisplays]);
  const worst = useMemo(() => getWorstVersionByVariance(rowDisplays), [rowDisplays]);
  const latest = useMemo(() => getLatestVersion(rowDisplays), [rowDisplays]);
  const recentCmp = useMemo(() => getMostRecentComparison(comparisonDisplays), [comparisonDisplays]);

  const interpretationLines = useMemo(() => {
    const lines: string[] = [];
    if (best && best.averageVariancePercent != null) {
      lines.push(
        `Best observed version by smallest absolute average variance %: ${best.versionLabel} (${fmtNum(best.averageVariancePercent)}%).`,
      );
    }
    if (worst && worst.averageVariancePercent != null) {
      lines.push(
        `Worst observed version by largest absolute average variance %: ${worst.versionLabel} (${fmtNum(worst.averageVariancePercent)}%).`,
      );
    }
    if (latest) {
      lines.push(`Latest estimator version in this result set: ${latest.versionLabel}.`);
      const dom = getDominantUnderOverPattern(latest);
      if (dom.pattern === "underestimation") {
        lines.push(
          `Most common reviewed under/over tag pattern for ${latest.versionLabel}: underestimation (${dom.count}).`,
        );
      } else if (dom.pattern === "overestimation") {
        lines.push(
          `Most common reviewed under/over tag pattern for ${latest.versionLabel}: overestimation (${dom.count}).`,
        );
      } else if (dom.pattern === "tie_under_over" && dom.count > 0) {
        lines.push(
          `Reviewed under/over tag counts tie for ${latest.versionLabel}: underestimation ${latest.underestimationTagCount}, overestimation ${latest.overestimationTagCount}.`,
        );
      }
    }
    if (recentCmp && recentCmp.deltaVariancePercent != null) {
      const d = recentCmp.variancePercentDirection;
      lines.push(
        `Latest adjacent comparison: v${recentCmp.baselineVersion} → v${recentCmp.comparisonVersion}; Δ average variance % = ${fmtNum(recentCmp.deltaVariancePercent)} (${d}).`,
      );
    }
    return lines;
  }, [best, worst, latest, recentCmp]);

  const empty = !loading && !error && rowDisplays.length === 0;

  const governanceIntelHref = useMemo(() => {
    const v = filters.version.trim();
    return v
      ? `/admin/deep-clean/estimator-governance?version=${encodeURIComponent(v)}`
      : "/admin/deep-clean/estimator-governance";
  }, [filters.version]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Deep Clean Estimator Impact</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Version-grouped calibration outcomes using the estimator config version stored at estimate time (
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
            GET /api/v1/admin/deep-clean/estimator-impact
          </code>
          ). Defaults: reviewed + usable rows only.
        </p>
        <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <Link href="/admin" className="text-blue-700 hover:underline">
            Admin home
          </Link>
          <Link
            href="/admin/deep-clean/analytics"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-estimator-impact-link-analytics"
          >
            Deep Clean Analytics
          </Link>
          <Link
            href="/admin/deep-clean/insights"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-estimator-impact-link-insights"
          >
            Deep Clean Insights
          </Link>
          <Link
            href="/admin/deep-clean/estimator"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-estimator-impact-link-estimator"
          >
            Deep Clean Estimator
          </Link>
          <Link
            href="/admin/deep-clean/estimator-governance"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-estimator-impact-link-governance"
          >
            Estimator governance
          </Link>
          <Link
            href={governanceIntelHref}
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-estimator-impact-link-governance-intel"
          >
            Open governance intelligence
          </Link>
          <Link
            href="/admin/deep-clean/estimator-monitoring"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-estimator-impact-link-monitoring"
          >
            Open monitoring
          </Link>
        </p>
      </div>

      <DeepCleanEstimatorImpactFilters value={filters} onChange={setFilters} disabled={loading} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}

      {empty ? (
        <p className="text-sm text-slate-600" data-testid="deep-clean-estimator-impact-empty">
          No program calibration rows matched these filters.
        </p>
      ) : null}

      {!loading && !empty && rowDisplays.length > 0 ? (
        <>
          <section
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            data-testid="deep-clean-estimator-impact-summary"
          >
            <h2 className="text-lg font-semibold text-slate-900">At a glance</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
              <li>Best (smallest |avg variance %|): {best ? best.versionLabel : "—"}</li>
              <li>Worst (largest |avg variance %|): {worst ? worst.versionLabel : "—"}</li>
              <li>Latest version in set: {latest ? latest.versionLabel : "—"}</li>
              <li>
                Latest comparison:{" "}
                {recentCmp
                  ? `v${recentCmp.baselineVersion} → v${recentCmp.comparisonVersion} (${recentCmp.variancePercentDirection})`
                  : "—"}
              </li>
            </ul>
          </section>

          <section
            className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4"
            data-testid="deep-clean-estimator-impact-interpretation"
          >
            <h2 className="text-lg font-semibold text-slate-900">Interpretation (deterministic)</h2>
            <ul className="list-inside list-disc text-sm text-slate-700">
              {interpretationLines.length === 0 ? (
                <li>No deterministic statements for this result set.</li>
              ) : (
                interpretationLines.map((line) => <li key={line}>{line}</li>)
              )}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Version performance</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table
                className="min-w-full border-collapse text-left text-sm"
                data-testid="deep-clean-estimator-impact-version-table"
              >
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                    <th className="px-3 py-2">Version</th>
                    <th className="px-3 py-2">Label</th>
                    <th className="px-3 py-2">Programs</th>
                    <th className="px-3 py-2">Usable</th>
                    <th className="px-3 py-2">Reviewed</th>
                    <th className="px-3 py-2">Avg var (min)</th>
                    <th className="px-3 py-2">Avg var (%)</th>
                    <th className="px-3 py-2">Under</th>
                    <th className="px-3 py-2">Over</th>
                    <th className="px-3 py-2">Est.</th>
                    <th className="px-3 py-2">Ops</th>
                    <th className="px-3 py-2">Scope</th>
                    <th className="px-3 py-2">Governance</th>
                  </tr>
                </thead>
                <tbody>
                  {rowDisplays.map((r) => (
                    <tr key={`${r.estimatorConfigVersion ?? "null"}-${r.versionLabel}`} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.estimatorConfigVersion == null ? "null" : r.estimatorConfigVersion}
                      </td>
                      <td className="px-3 py-2">{r.versionLabel}</td>
                      <td className="px-3 py-2">{r.programCount}</td>
                      <td className="px-3 py-2">{r.usableProgramCount}</td>
                      <td className="px-3 py-2">{r.reviewedProgramCount}</td>
                      <td className="px-3 py-2">{fmtNum(r.averageVarianceMinutes)}</td>
                      <td className="px-3 py-2">{fmtNum(r.averageVariancePercent)}</td>
                      <td className="px-3 py-2">{r.underestimationTagCount}</td>
                      <td className="px-3 py-2">{r.overestimationTagCount}</td>
                      <td className="px-3 py-2">{r.estimatorIssueCount}</td>
                      <td className="px-3 py-2">{r.operationalIssueCount}</td>
                      <td className="px-3 py-2">{r.scopeIssueCount}</td>
                      <td className="px-3 py-2">
                        {r.estimatorConfigVersion != null ? (
                          <Link
                            href={`/admin/deep-clean/estimator-governance?version=${r.estimatorConfigVersion}`}
                            className="text-xs text-blue-700 underline"
                            data-testid={`deep-clean-estimator-impact-row-governance-${r.estimatorConfigVersion}`}
                          >
                            Open
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Adjacent version comparisons</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table
                className="min-w-full border-collapse text-left text-sm"
                data-testid="deep-clean-estimator-impact-comparisons"
              >
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                    <th className="px-3 py-2">Baseline</th>
                    <th className="px-3 py-2">Comparison</th>
                    <th className="px-3 py-2">Δ var %</th>
                    <th className="px-3 py-2">Δ var (min)</th>
                    <th className="px-3 py-2">Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonDisplays.map((c) => (
                    <tr
                      key={`${c.baselineVersion}-${c.comparisonVersion}`}
                      data-testid={`deep-clean-estimator-impact-comparison-${c.baselineVersion}-${c.comparisonVersion}`}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-2 font-mono text-xs">v{c.baselineVersion}</td>
                      <td className="px-3 py-2 font-mono text-xs">v{c.comparisonVersion}</td>
                      <td className="px-3 py-2">{fmtNum(c.deltaVariancePercent)}</td>
                      <td className="px-3 py-2">{fmtNum(c.deltaVarianceMinutes)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${directionBadgeClass(c.variancePercentDirection)}`}
                          data-testid={`deep-clean-estimator-impact-direction-${c.variancePercentDirection}`}
                        >
                          {c.variancePercentDirection}
                        </span>
                      </td>
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
