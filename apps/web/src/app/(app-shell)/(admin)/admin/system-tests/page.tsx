"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import {
  buildSystemTestsTrendInsights,
  buildSystemTestsTrendPoints,
  fetchAdminSystemTestRuns,
  fetchAdminSystemTestsSummary,
} from "@/lib/api/systemTests";
import { SystemTestsRunsTable } from "@/components/admin/system-tests/SystemTestsRunsTable";
import { SystemTestsSummaryCards } from "@/components/admin/system-tests/SystemTestsSummaryCards";
import { SystemTestsTrendCharts } from "@/components/admin/system-tests/SystemTestsTrendCharts";
import { SystemTestsTrendInsightsPanel } from "@/components/admin/system-tests/SystemTestsTrendInsights";
import type { SystemTestsRunsResponse, SystemTestsSummaryResponse } from "@/types/systemTests";

function meanDurationMs(items: SystemTestsRunsResponse["items"]): number | null {
  const nums = items.map((r) => r.durationMs).filter((d): d is number => d != null);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default function AdminSystemTestsPage() {
  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [summary, setSummary] = useState<SystemTestsSummaryResponse | null>(null);
  const [runsResponse, setRunsResponse] = useState<SystemTestsRunsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        const [sum, list] = await Promise.all([
          fetchAdminSystemTestsSummary(token),
          fetchAdminSystemTestRuns(token, { page: 1, limit: 50 }),
        ]);
        if (!cancelled) {
          setSummary(sum);
          setRunsResponse(list);
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

  const avgMs = useMemo(
    () => (runsResponse ? meanDurationMs(runsResponse.items) : null),
    [runsResponse],
  );

  const trendPoints = useMemo(
    () => (runsResponse ? buildSystemTestsTrendPoints(runsResponse) : []),
    [runsResponse],
  );

  const trendInsights = useMemo(
    () => buildSystemTestsTrendInsights(trendPoints),
    [trendPoints],
  );

  const latestRunId = runsResponse?.items[0]?.id;

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
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">System Tests</h1>
          <p className="max-w-3xl text-sm text-white/65">
            Hosted Playwright run ingestion and health monitoring
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-white/60">Loading system test data…</p>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : (
          <>
            <SystemTestsSummaryCards
              summary={summary}
              totalRuns={runsResponse?.total ?? 0}
              averageDurationMs={avgMs}
            />

            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-lg font-semibold text-white">Trends</h2>
                <Link
                  href="/admin/system-tests/compare"
                  className="text-sm font-medium text-violet-300 hover:text-violet-200"
                >
                  Compare two runs
                </Link>
              </div>
              <SystemTestsTrendInsightsPanel insights={trendInsights} />
              <SystemTestsTrendCharts points={trendPoints} />
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Recent runs</h2>
              {runsResponse ? (
                <SystemTestsRunsTable runs={runsResponse} latestRunId={latestRunId} />
              ) : (
                <p className="text-sm text-white/50">No data.</p>
              )}
            </section>

            {summary?.latestFailures?.length ? (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Latest failures (up to 20)</h2>
                <div className="space-y-2">
                  {summary.latestFailures.map((f, i) => (
                    <div
                      key={`${f.runId}-${f.fullName}-${i}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{f.fullName}</p>
                          <p className="mt-1 text-xs text-white/50">
                            {f.suite} · {f.filePath}
                          </p>
                          {f.errorMessage ? (
                            <p className="mt-2 text-sm text-red-200/90">{f.errorMessage}</p>
                          ) : null}
                        </div>
                        <Link
                          href={`/admin/system-tests/${f.runId}`}
                          className="shrink-0 text-sm font-medium text-sky-300 hover:text-sky-200"
                        >
                          View run
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
