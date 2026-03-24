"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchAdminAuthorityDrift,
  type BookingAuthorityDriftPayload,
} from "@/lib/api/adminAuthorityQuality";
import { AdminAuthorityTagCountTable } from "@/components/admin/authority-shared/AdminAuthorityTagCountTable";
import { AUTHORITY_ADMIN_DEFAULT_WINDOW_HOURS } from "@/lib/admin/authorityAdminDefaults";
import { parseAuthorityAdminSearchParams } from "@/lib/admin/authorityAdminUrlParams";
import { WEB_ENV } from "@/lib/env";
import { getStoredAccessToken } from "@/lib/auth";

const API_BASE = WEB_ENV.apiBaseUrl;

export function AdminAuthorityDriftClient() {
  const rawSearchParams = useSearchParams();
  const searchParams = rawSearchParams ?? new URLSearchParams();
  const qKey = searchParams.toString();
  const q = useMemo(
    () => parseAuthorityAdminSearchParams(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key tracks deep link changes
    [qKey],
  );

  const [data, setData] = useState<BookingAuthorityDriftPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in at /admin/auth with an admin account.");
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchParams: {
        topLimit: number;
        windowHours?: number;
        updatedSince?: string;
      } = { topLimit: 20 };
      if (q.updatedSince?.trim()) {
        fetchParams.updatedSince = q.updatedSince.trim();
      } else if (q.windowHours?.trim() && /^\d+$/.test(q.windowHours)) {
        fetchParams.windowHours = parseInt(q.windowHours, 10);
      } else {
        fetchParams.windowHours = AUTHORITY_ADMIN_DEFAULT_WINDOW_HOURS;
      }
      const d = await fetchAdminAuthorityDrift(API_BASE, token, fetchParams);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load drift summary.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q.updatedSince, q.windowHours]);

  useEffect(() => {
    void load();
  }, [load]);

  const mismatchHot = data
    ? Object.entries(data.mismatchTypeCountsInScope).filter(([, c]) => c > 0)
    : [];

  const alertFilterActive =
    Boolean(q.authorityTag?.trim()) ||
    Boolean(q.authorityTagAxis?.trim()) ||
    Boolean(q.authorityMismatchType?.trim()) ||
    q.focusBookingIds.length > 0;

  const highlightTagForAxis = (axis: "problem" | "surface" | "method") =>
    q.authorityTagAxis?.trim() === axis && q.authorityTag?.trim()
      ? q.authorityTag.trim()
      : null;

  return (
    <main
      className="min-h-screen bg-neutral-950 px-6 py-12 text-white"
      data-testid="admin-authority-drift-page"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Admin · Operations
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Authority drift review</h1>
          <p className="max-w-2xl text-sm text-white/65">
            Unstable tags, mismatch-heavy types, and override-heavy tags for the current scope (
            <code className="rounded bg-black/40 px-1 text-xs text-emerald-100/90">
              GET /api/v1/admin/authority/drift
            </code>
            ).
          </p>
          {alertFilterActive ? (
            <p
              className="max-w-2xl text-xs text-amber-100/80"
              data-testid="admin-authority-drift-alert-filters"
            >
              Alert deep-link filters are active (tag / mismatch / booking focus). Tables highlight
              matching rows where possible.
            </p>
          ) : null}
          <div
            className="flex flex-wrap gap-3 pt-1 text-sm"
            data-testid="admin-authority-drift-crosslinks"
          >
            <Link
              href="/admin/authority/quality"
              className="text-white/55 underline decoration-white/25 underline-offset-4 hover:text-white"
              data-testid="admin-authority-drift-link-quality"
            >
              Quality metrics
            </Link>
            <Link
              href="/admin/authority/alerts"
              className="text-white/55 underline decoration-white/25 underline-offset-4 hover:text-white"
              data-testid="admin-authority-drift-link-alerts"
            >
              Threshold alerts
            </Link>
            <Link
              href="/admin/authority/report"
              className="text-white/55 underline decoration-white/25 underline-offset-4 hover:text-white"
            >
              Tag frequency report
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-white/55" data-testid="admin-authority-drift-loading">
            Loading drift signals…
          </p>
        ) : null}

        {!loading && data ? (
          <div className="space-y-8">
            <section data-testid="admin-authority-drift-unstable">
              <h2 className="mb-3 text-lg font-semibold text-white">Top unstable tags</h2>
              <p className="mb-3 text-xs text-white/50">
                Combined override bookings + mismatch events per axis (higher = more friction).
              </p>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-950/95 text-xs uppercase tracking-[0.12em] text-white/45">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Axis</th>
                      <th className="px-4 py-2.5 font-medium">Tag</th>
                      <th className="px-4 py-2.5 text-right font-medium">Overrides</th>
                      <th className="px-4 py-2.5 text-right font-medium">Mismatches</th>
                      <th className="px-4 py-2.5 text-right font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topUnstableTags.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-white/45">
                          No unstable tag signal in this window.
                        </td>
                      </tr>
                    ) : (
                      data.topUnstableTags.map((r) => {
                        const hi =
                          Boolean(q.authorityTag?.trim()) &&
                          Boolean(q.authorityTagAxis?.trim()) &&
                          r.tag === q.authorityTag!.trim() &&
                          r.axis === q.authorityTagAxis!.trim();
                        return (
                          <tr
                            key={`${r.axis}:${r.tag}`}
                            className={`border-t border-white/5 ${hi ? "bg-amber-500/10 ring-1 ring-inset ring-amber-400/35" : ""}`}
                            data-highlighted={hi ? "true" : undefined}
                          >
                            <td className="px-4 py-2 text-xs text-white/70">{r.axis}</td>
                            <td className="px-4 py-2 font-mono text-xs text-white/90">{r.tag}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-white/85">
                              {r.overrideBookings}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums text-white/85">
                              {r.mismatchEvents}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold tabular-nums text-amber-100/90">
                              {r.instabilityScore}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section data-testid="admin-authority-drift-mismatch-patterns">
              <h2 className="mb-3 text-lg font-semibold text-white">Mismatch-heavy patterns</h2>
              {mismatchHot.length === 0 ? (
                <p className="text-sm text-white/45">No mismatch rows in scope.</p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-950/95 text-xs uppercase tracking-[0.12em] text-white/45">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Mismatch type</th>
                        <th className="px-4 py-2.5 text-right font-medium">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mismatchHot
                        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                        .map(([type, count]) => {
                          const hi =
                            Boolean(q.authorityMismatchType?.trim()) &&
                            type === q.authorityMismatchType!.trim();
                          return (
                            <tr
                              key={type}
                              className={`border-t border-white/5 ${hi ? "bg-amber-500/10 ring-1 ring-inset ring-amber-400/35" : ""}`}
                              data-highlighted={hi ? "true" : undefined}
                            >
                              <td className="px-4 py-2 font-mono text-xs text-white/90">{type}</td>
                              <td className="px-4 py-2 text-right tabular-nums">{count}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section data-testid="admin-authority-drift-override-heavy">
              <h2 className="mb-3 text-lg font-semibold text-white">Override-heavy tags</h2>
              <div className="grid gap-4 lg:grid-cols-3">
                <AdminAuthorityTagCountTable
                  title="Problems"
                  rows={data.tagsHighestOverrideFrequency.problems}
                  testId="admin-drift-ov-prob"
                  emptyCopy="None."
                  highlightTag={highlightTagForAxis("problem")}
                />
                <AdminAuthorityTagCountTable
                  title="Surfaces"
                  rows={data.tagsHighestOverrideFrequency.surfaces}
                  testId="admin-drift-ov-surf"
                  emptyCopy="None."
                  highlightTag={highlightTagForAxis("surface")}
                />
                <AdminAuthorityTagCountTable
                  title="Methods"
                  rows={data.tagsHighestOverrideFrequency.methods}
                  testId="admin-drift-ov-meth"
                  emptyCopy="None."
                  highlightTag={highlightTagForAxis("method")}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
              <h2 className="font-semibold text-white">Mismatch-co-occurring tags</h2>
              <p className="mt-1 text-xs text-white/45">
                Tags on authority rows linked to mismatch records (recent window).
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <AdminAuthorityTagCountTable
                  title="Problems"
                  rows={data.tagsHighestMismatchFrequency.problems}
                  testId="admin-drift-mm-prob"
                  emptyCopy="None."
                  highlightTag={highlightTagForAxis("problem")}
                />
                <AdminAuthorityTagCountTable
                  title="Surfaces"
                  rows={data.tagsHighestMismatchFrequency.surfaces}
                  testId="admin-drift-mm-surf"
                  emptyCopy="None."
                  highlightTag={highlightTagForAxis("surface")}
                />
                <AdminAuthorityTagCountTable
                  title="Methods"
                  rows={data.tagsHighestMismatchFrequency.methods}
                  testId="admin-drift-mm-meth"
                  emptyCopy="None."
                  highlightTag={highlightTagForAxis("method")}
                />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
