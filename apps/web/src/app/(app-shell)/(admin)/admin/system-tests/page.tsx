"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { fetchAdminSystemTestRunDetail, fetchAdminSystemTestRuns } from "@/lib/api/systemTests";
import { analyzeSystemTestHistory } from "@/lib/systemTests/analyzeSystemTestHistory";
import { buildSystemTestReportFromPayload } from "@/lib/systemTests/buildSystemTestReport";
import { buildSystemTestReportPayload } from "@/lib/systemTests/buildSystemTestReportPayload";
import { buildSystemTestTriageReportFromPayload } from "@/lib/systemTests/buildSystemTestTriageReport";
import {
  buildTrendPointsFromRuns,
  normalizeRunSummaryFromListItem,
  normalizeSystemTestRunDetail,
  trendVsPrevious,
} from "@/lib/systemTests/normalizeSystemTestRun";
import { sortSystemTestRunsListNewestFirst } from "@/lib/systemTests/sortSystemTestRuns";
import { SystemTestsCopyReportButton } from "@/components/admin/system-tests/SystemTestsCopyReportButton";
import { SystemTestsHistoricalInsightsPanel } from "@/components/admin/system-tests/SystemTestsHistoricalInsightsPanel";
import { SystemTestsLatestFailuresPanel } from "@/components/admin/system-tests/SystemTestsLatestFailuresPanel";
import { SystemTestsPageHeader } from "@/components/admin/system-tests/SystemTestsPageHeader";
import { SystemTestsRerunPriorityPanel } from "@/components/admin/system-tests/SystemTestsRerunPriorityPanel";
import { SystemTestsRunsTable } from "@/components/admin/system-tests/SystemTestsRunsTable";
import { SystemTestsSummaryCards } from "@/components/admin/system-tests/SystemTestsSummaryCards";
import { SystemTestsTrendStrip } from "@/components/admin/system-tests/SystemTestsTrendStrip";
import { SystemTestIncidentOperationsSection } from "@/components/admin/system-tests/SystemTestIncidentOperationsSection";
import { SystemTestsUnstableFilesPanel } from "@/components/admin/system-tests/SystemTestsUnstableFilesPanel";
import type { SystemTestRunDetailResponse, SystemTestRunsListItem } from "@/types/systemTests";

export default function AdminSystemTestsPage() {
  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [runs, setRuns] = useState<SystemTestRunsListItem[]>([]);
  const [latestDetail, setLatestDetail] = useState<SystemTestRunDetailResponse | null>(null);
  const [priorDetails, setPriorDetails] = useState<SystemTestRunDetailResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setToken(getStoredAccessToken());
    setTokenChecked(true);
  }, []);

  useEffect(() => {
    if (!tokenChecked || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchAdminSystemTestRuns(token, { limit: 25, page: 1 });
        if (!cancelled) {
          setRuns(list.items);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load system tests.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked]);

  const { sorted: sortedRuns, listChronologyNote } = useMemo(
    () => sortSystemTestRunsListNewestFirst(runs),
    [runs],
  );

  const latestRun = sortedRuns[0] ?? null;
  const previousRun = sortedRuns[1] ?? null;

  useEffect(() => {
    if (!tokenChecked || !token || !latestRun) {
      setLatestDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setDetailError(null);
      setDetailLoading(true);
      try {
        const d = await fetchAdminSystemTestRunDetail(token, latestRun.id);
        if (!cancelled) setLatestDetail(d);
      } catch (e) {
        if (!cancelled) {
          setLatestDetail(null);
          setDetailError(e instanceof Error ? e.message : "Failed to load latest run detail.");
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked, latestRun?.id]);

  useEffect(() => {
    if (!tokenChecked || !token || !latestRun || !sortedRuns.length) {
      setPriorDetails([]);
      setHistoryLoading(false);
      return;
    }

    const idx = sortedRuns.findIndex((r) => r.id === latestRun.id);
    if (idx < 0) {
      setPriorDetails([]);
      return;
    }

    const older = sortedRuns.slice(idx + 1, idx + 10);
    if (!older.length) {
      setPriorDetails([]);
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      try {
        const settled = await Promise.allSettled(
          older.map((r) => fetchAdminSystemTestRunDetail(token, r.id)),
        );
        if (cancelled) return;
        const ok = settled
          .filter((s): s is PromiseFulfilledResult<SystemTestRunDetailResponse> => s.status === "fulfilled")
          .map((s) => s.value);
        setPriorDetails(ok);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked, latestRun?.id, sortedRuns]);

  const latestSummary = useMemo(
    () => (latestRun ? normalizeRunSummaryFromListItem(latestRun) : null),
    [latestRun],
  );

  const prevSummary = useMemo(
    () => (previousRun ? normalizeRunSummaryFromListItem(previousRun) : null),
    [previousRun],
  );

  const trendVsPrev = useMemo(
    () => (latestSummary ? trendVsPrevious(latestSummary, prevSummary) : null),
    [latestSummary, prevSummary],
  );

  const trendPoints = useMemo(() => buildTrendPointsFromRuns(sortedRuns, { limit: 20 }), [sortedRuns]);

  const failureDigest = useMemo(() => {
    if (latestDetail) {
      return normalizeSystemTestRunDetail(latestDetail).failureGroups;
    }
    return [];
  }, [latestDetail]);

  const historicalAnalysis = useMemo(() => {
    if (!latestDetail) return null;
    return analyzeSystemTestHistory(latestDetail, priorDetails);
  }, [latestDetail, priorDetails]);

  const getLatestReportText = useMemo(() => {
    return async () => {
      if (!latestRun || !token) throw new Error("Missing latest run.");
      const detail = latestDetail ?? (await fetchAdminSystemTestRunDetail(token, latestRun.id));
      const payload = buildSystemTestReportPayload({
        currentDetailResponse: detail,
        previousRunSummary: prevSummary,
      });
      return buildSystemTestReportFromPayload(payload);
    };
  }, [latestRun, latestDetail, token, prevSummary]);

  const getTriageReportText = useMemo(() => {
    return async () => {
      if (!latestDetail || !historicalAnalysis) throw new Error("Missing triage context.");
      const payload = buildSystemTestReportPayload({
        currentDetailResponse: latestDetail,
        previousRunSummary: prevSummary,
        priorDetailResponses: priorDetails.length ? priorDetails : undefined,
        historicalAnalysis,
      });
      return buildSystemTestTriageReportFromPayload(payload);
    };
  }, [latestDetail, historicalAnalysis, prevSummary, priorDetails]);

  if (!tokenChecked) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl space-y-6">
          <p className="text-sm text-white/60">Checking authentication…</p>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-400/25 bg-amber-500/10 p-8 text-amber-50">
          <h1 className="text-xl font-semibold">Authentication required</h1>
          <p className="mt-2 text-sm text-amber-100/85">
            Sign in as an admin to view hosted system test runs and diagnostics.
          </p>
          <Link
            href="/admin/auth?next=/admin/system-tests"
            className="mt-6 inline-flex rounded-xl border border-amber-300/30 bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-50"
          >
            Go to admin sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <SystemTestsPageHeader
              summary={latestSummary}
              subtitle="Structured failure intelligence for hosted Playwright runs — copy a report and paste it into ChatGPT for root-cause diagnosis."
            />
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <div className="flex flex-col items-end gap-1">
              <Link
                href="/admin/system-tests/pipeline"
                className="text-sm font-medium text-teal-300 hover:text-teal-200"
              >
                Pipeline queue
              </Link>
              <Link
                href="/admin/system-tests/automation"
                className="text-sm font-medium text-sky-300 hover:text-sky-200"
              >
                Automation and digests
              </Link>
              <Link
                href="/admin/system-tests/compare"
                className="text-sm font-medium text-violet-300 hover:text-violet-200"
              >
                Compare two runs
              </Link>
              <Link
                href="/admin/system-tests/families"
                className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
              >
                Failure families
              </Link>
              <Link
                href="/admin/system-tests/incidents"
                className="text-sm font-medium text-teal-300 hover:text-teal-200"
              >
                Incidents
              </Link>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              {latestRun && trendVsPrev ? (
                <SystemTestsCopyReportButton getReportText={getLatestReportText} />
              ) : null}
              {latestDetail && historicalAnalysis ? (
                <SystemTestsCopyReportButton getReportText={getTriageReportText} label="Copy triage report" />
              ) : null}
            </div>
          </div>
        </div>

        <SystemTestIncidentOperationsSection accessToken={token} />

        {loading ? (
          <p className="text-sm text-white/60">Loading system test data…</p>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
        ) : !sortedRuns.length ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
            <p className="text-lg font-medium text-white">No system test runs recorded yet</p>
            <p className="mt-2 text-sm text-white/55">
              Ingest runs via <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs">POST /api/v1/admin/system-tests/report</code>{" "}
              to populate this dashboard.
            </p>
          </div>
        ) : (
          <>
            {latestSummary && trendVsPrev ? (
              <SystemTestsSummaryCards summary={latestSummary} trendVsPrevious={trendVsPrev} />
            ) : null}

            {listChronologyNote ? (
              <p className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/95">
                Run list chronology: {listChronologyNote}
              </p>
            ) : null}

            {trendPoints.length > 0 ? (
              <SystemTestsTrendStrip
                points={trendPoints}
                currentRunId={latestRun?.id ?? null}
                previousRunId={previousRun?.id ?? null}
              />
            ) : null}

            <SystemTestsLatestFailuresPanel
              runId={latestRun?.id ?? ""}
              groups={failureDigest}
              loading={Boolean(latestRun && detailLoading && !detailError)}
              error={detailError}
              failureProfiles={historicalAnalysis?.failureProfiles}
              historyLoading={historyLoading}
            />

            {historicalAnalysis ? (
              <>
                <SystemTestsHistoricalInsightsPanel
                  insights={historicalAnalysis.historicalInsights}
                  chronologyNote={historicalAnalysis.historyChronologyNote}
                  loading={historyLoading}
                  historyWindowSize={historicalAnalysis.historyWindowSize}
                />
                <SystemTestsRerunPriorityPanel
                  groups={failureDigest}
                  profiles={historicalAnalysis.failureProfiles}
                  loading={historyLoading}
                />
                <SystemTestsUnstableFilesPanel files={historicalAnalysis.unstableFiles} loading={historyLoading} />
              </>
            ) : null}

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Runs</h2>
              <SystemTestsRunsTable runs={sortedRuns} latestRunId={latestRun?.id ?? null} accessToken={token} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
