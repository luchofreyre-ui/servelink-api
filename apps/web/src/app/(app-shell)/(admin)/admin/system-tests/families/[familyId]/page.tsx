"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SystemTestsResolutionWorkspace } from "@/components/admin/system-tests/SystemTestsResolutionWorkspace";
import { fetchAdminSystemTestFamilyDetail } from "@/lib/api/systemTestFamilies";
import { fetchAdminSystemTestFamilyResolution } from "@/lib/api/systemTestResolution";
import { getStoredAccessToken } from "@/lib/auth";
import type { SystemTestFamilyDetailApi } from "@/lib/api/systemTestFamilies";
import { lifecycleStateLabel } from "@/lib/system-tests/lifecycle";
import type { SystemTestResolution } from "@/types/systemTestResolution";

export default function AdminSystemTestFamilyDetailPage() {
  const params = useParams();
  const familyId = String(params?.familyId ?? "");

  const [token, setToken] = useState<string | null>(null);
  const [detail, setDetail] = useState<SystemTestFamilyDetailApi | null>(null);
  const [resolution, setResolution] = useState<SystemTestResolution | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getStoredAccessToken());
  }, []);

  useEffect(() => {
    if (!token || !familyId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setResolutionError(null);
      try {
        const d = await fetchAdminSystemTestFamilyDetail(token, familyId);
        if (cancelled) return;
        setDetail(d);

        try {
          const r = await fetchAdminSystemTestFamilyResolution(familyId);
          if (!cancelled) setResolution(r);
        } catch (e) {
          if (!cancelled) {
            setResolution(null);
            setResolutionError(
              e instanceof Error ? e.message : "Failed to load resolution intelligence.",
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load family.");
          setDetail(null);
          setResolution(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, familyId]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <p>
        <Link
          href="/admin/system-tests/families"
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← All families
        </Link>
      </p>

      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
      {error ? <p className="text-sm text-amber-800">{error}</p> : null}

      {detail ?
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Failure family
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {detail.displayTitle ?? detail.familyKey}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
              <span>Status: {detail.status}</span>
              <span>·</span>
              <span>Trend: {detail.trendKind}</span>
              <span>·</span>
              <span>{detail.recurrenceLine ?? "—"}</span>
              <span>·</span>
              <span>
                Lifecycle: {lifecycleStateLabel(detail.lifecycle.lifecycleState)} (
                {detail.lifecycle.seenInRunCount}/{detail.lifecycle.recentRunCountConsidered} recent runs)
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Family key
                </p>
                <p className="mt-2 break-words text-sm text-slate-800">{detail.familyKey}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total occurrences
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {String(detail.totalOccurrencesAcrossRuns)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  First seen run
                </p>
                <p className="mt-2 break-words text-sm text-slate-800">
                  {detail.firstSeenRunId ?? "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Last seen run
                </p>
                <p className="mt-2 break-words text-sm text-slate-800">
                  {detail.lastSeenRunId ?? "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Affected runs
                </p>
                <p className="mt-2 text-sm text-slate-800">{detail.affectedRunCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Affected files
                </p>
                <p className="mt-2 text-sm text-slate-800">{detail.affectedFileCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Family version
                </p>
                <p className="mt-2 text-sm text-slate-800">{detail.familyVersion}</p>
              </div>
            </div>

            {detail.rootCauseSummary ?
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Existing family summary
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {detail.rootCauseSummary}
                </p>
              </div>
            : null}
          </section>

          {resolution ?
            <SystemTestsResolutionWorkspace resolution={resolution} />
          : resolutionError ?
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Resolution intelligence unavailable</p>
              <p className="mt-1 text-amber-800/90">{resolutionError}</p>
            </section>
          : null}

          {detail.incident ?
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Incident</p>
              <p className="mt-1">
                <Link
                  href={`/admin/system-tests/incidents/${encodeURIComponent(detail.incident.incidentKey)}`}
                  className="font-medium text-teal-800 underline decoration-teal-300 hover:decoration-teal-600"
                >
                  {detail.incident.displayTitle}
                </Link>
              </p>
              <p className="mt-1 text-xs text-teal-800/80">
                Severity {detail.incident.severity} · status {detail.incident.status} · role{" "}
                {detail.incident.role}
              </p>
            </div>
          : null}

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Recent memberships</h2>
            <ul className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {detail.memberships.map((m) => (
                <li
                  key={`${m.runId}-${m.failureGroupId}`}
                  className="border-b border-slate-100 pb-3 last:border-0"
                >
                  <p className="font-mono text-xs text-slate-500">
                    run {m.runId.slice(0, 10)}… · {m.matchBasis}
                  </p>
                  <p className="text-sm text-slate-800">{m.title}</p>
                  <p className="text-xs text-slate-500">{m.file}</p>
                  <Link
                    href={`/admin/system-tests/${m.runId}`}
                    className="mt-1 inline-block text-xs font-medium text-sky-700 hover:text-sky-800"
                  >
                    Open run
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      : null}
    </main>
  );
}
