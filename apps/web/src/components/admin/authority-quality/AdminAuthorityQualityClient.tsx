"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchAdminAuthorityDrift,
  fetchAdminAuthorityQuality,
  type BookingAuthorityDriftPayload,
  type BookingAuthorityQualityPayload,
} from "@/lib/api/adminAuthorityQuality";
import { fetchAdminFoAuthorityFeedbackSummary } from "@/lib/api/adminAuthorityFoFeedback";
import type { FoAuthorityFeedbackAdminSummaryPayload } from "@/lib/api/adminAuthorityFoFeedback";
import { fetchAdminAuthorityUnmappedTags } from "@/lib/api/adminAuthorityUnmappedTags";
import type { BookingAuthorityUnmappedTagsPayload } from "@/lib/api/adminAuthorityUnmappedTags";
import { AdminAuthorityTagCountTable } from "@/components/admin/authority-shared/AdminAuthorityTagCountTable";
import {
  AUTHORITY_ADMIN_DEFAULT_WINDOW_HOURS,
  AUTHORITY_ADMIN_MIN_SAMPLE_FOR_FRICTION_NUDGE,
} from "@/lib/admin/authorityAdminDefaults";
import { WEB_ENV } from "@/lib/env";
import { getStoredAccessToken } from "@/lib/auth";

const API_BASE = WEB_ENV.apiBaseUrl;

const scopedQuery = { windowHours: AUTHORITY_ADMIN_DEFAULT_WINDOW_HOURS };

function pct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function RateTile(props: { label: string; value: string; hint: string }) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5"
      title={props.hint}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
        {props.label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{props.value}</p>
      <p className="mt-1.5 text-[11px] leading-snug text-white/40">{props.hint}</p>
    </div>
  );
}

export function AdminAuthorityQualityClient() {
  const [authError, setAuthError] = useState<string | null>(null);

  const [quality, setQuality] = useState<BookingAuthorityQualityPayload | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityError, setQualityError] = useState<string | null>(null);

  const [drift, setDrift] = useState<BookingAuthorityDriftPayload | null>(null);
  const [driftLoading, setDriftLoading] = useState(false);
  const [driftError, setDriftError] = useState<string | null>(null);

  const [foFeedback, setFoFeedback] = useState<FoAuthorityFeedbackAdminSummaryPayload | null>(null);
  const [foLoading, setFoLoading] = useState(false);
  const [foError, setFoError] = useState<string | null>(null);

  const [unmapped, setUnmapped] = useState<BookingAuthorityUnmappedTagsPayload | null>(null);
  const [unmappedLoading, setUnmappedLoading] = useState(false);
  const [unmappedError, setUnmappedError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      setAuthError("Sign in at /admin/auth with an admin account.");
      return;
    }
    setAuthError(null);

    void (async () => {
      setQualityLoading(true);
      setQualityError(null);
      try {
        const q = await fetchAdminAuthorityQuality(API_BASE, token, {
          topLimit: 15,
          ...scopedQuery,
        });
        setQuality(q);
      } catch (e) {
        setQuality(null);
        setQualityError(
          e instanceof Error ? e.message : "Failed to load authority quality metrics.",
        );
      } finally {
        setQualityLoading(false);
      }
    })();

    void (async () => {
      setDriftLoading(true);
      setDriftError(null);
      try {
        const d = await fetchAdminAuthorityDrift(API_BASE, token, {
          topLimit: 10,
          ...scopedQuery,
        });
        setDrift(d);
      } catch (e) {
        setDrift(null);
        setDriftError(e instanceof Error ? e.message : "Failed to load drift summary.");
      } finally {
        setDriftLoading(false);
      }
    })();

    void (async () => {
      setFoLoading(true);
      setFoError(null);
      try {
        const fb = await fetchAdminFoAuthorityFeedbackSummary(API_BASE, token, {
          ...scopedQuery,
          topLimit: 12,
        });
        setFoFeedback(fb);
      } catch (e) {
        setFoFeedback(null);
        setFoError(e instanceof Error ? e.message : "Failed to load FO feedback summary.");
      } finally {
        setFoLoading(false);
      }
    })();

    void (async () => {
      setUnmappedLoading(true);
      setUnmappedError(null);
      try {
        const um = await fetchAdminAuthorityUnmappedTags(API_BASE, token, {
          ...scopedQuery,
          maxRowsScan: 400,
        });
        setUnmapped(um);
      } catch (e) {
        setUnmapped(null);
        setUnmappedError(e instanceof Error ? e.message : "Failed to load unmapped tags.");
      } finally {
        setUnmappedLoading(false);
      }
    })();
  }, []);

  const mismatchEntries = quality
    ? Object.entries(quality.mismatchCountsByType).filter(([, c]) => c > 0)
    : [];

  const meaningfulQualitySample =
    quality != null && quality.totalRecords >= AUTHORITY_ADMIN_MIN_SAMPLE_FOR_FRICTION_NUDGE;

  const showInstabilityNudge =
    meaningfulQualitySample &&
    (quality!.overrideRate >= 0.15 ||
      mismatchEntries.length > 0 ||
      (drift?.topUnstableTags?.length ?? 0) > 0);

  const nudgeQuery = new URLSearchParams({
    windowHours: String(AUTHORITY_ADMIN_DEFAULT_WINDOW_HOURS),
  }).toString();

  return (
    <main
      className="min-h-screen bg-neutral-950 px-6 py-12 text-white"
      data-testid="admin-authority-quality-page"
    >
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Admin · Operations
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Authority quality
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-white/65">
            Persisted classifier health — review and override rates, mismatch mix, and drift-oriented
            signals (
            <code className="rounded bg-black/40 px-1 py-0.5 text-xs text-emerald-100/90">
              GET /api/v1/admin/authority/quality
            </code>{" "}
            +{" "}
            <code className="rounded bg-black/40 px-1 py-0.5 text-xs text-emerald-100/90">
              GET /api/v1/admin/authority/drift
            </code>
            ).
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/authority/report"
              className="text-sm text-white/55 underline decoration-white/25 underline-offset-4 hover:text-white"
              data-testid="admin-authority-quality-to-report"
            >
              Tag frequency report
            </Link>
            <Link
              href="/admin/authority/drift"
              className="text-sm text-white/55 underline decoration-white/25 underline-offset-4 hover:text-white"
            >
              Drift review
            </Link>
            <Link
              href="/admin/authority/alerts"
              className="text-sm text-white/55 underline decoration-white/25 underline-offset-4 hover:text-white"
            >
              Alerts
            </Link>
          </div>
        </div>

        {authError ? (
          <div
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            data-testid="admin-authority-quality-error"
          >
            {authError}
          </div>
        ) : null}

        {!authError ? (
          <div className="space-y-10">
            {qualityLoading ? (
              <p className="text-sm text-white/55" data-testid="admin-authority-quality-loading">
                Loading authority quality…
              </p>
            ) : null}

            {qualityError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {qualityError}
              </div>
            ) : null}

            {showInstabilityNudge ? (
              <div
                className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-50/95"
                data-testid="admin-authority-quality-instability-nudge"
              >
                <p className="font-medium">Classifier friction signals in this window</p>
                <p className="mt-1 text-xs text-amber-100/75">
                  Review drift for tag-level noise and alerts for threshold breaches.
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold">
                  <Link
                    href={`/admin/authority/drift?${nudgeQuery}`}
                    className="text-white underline decoration-white/30 underline-offset-4"
                    data-testid="admin-authority-quality-nudge-drift"
                  >
                    Open drift review →
                  </Link>
                  <Link
                    href={`/admin/authority/alerts?${nudgeQuery}`}
                    className="text-white underline decoration-white/30 underline-offset-4"
                    data-testid="admin-authority-quality-nudge-alerts"
                  >
                    Open threshold alerts →
                  </Link>
                </div>
              </div>
            ) : null}

            {!qualityLoading && quality?.totalRecords === 0 ? (
              <p
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-6 text-sm text-white/60"
                data-testid="admin-authority-quality-empty"
              >
                No persisted authority results yet. Quality metrics will populate as bookings are
                classified.
              </p>
            ) : null}

            {!qualityLoading && quality && quality.totalRecords > 0 ? (
              <section className="space-y-4" data-testid="admin-authority-quality-summary">
                <h2 className="text-lg font-semibold text-white">Pipeline rates</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <RateTile
                    label="Total persisted"
                    value={String(quality.totalRecords)}
                    hint="Rows in BookingAuthorityResult for this scope."
                  />
                  <RateTile
                    label="Review rate"
                    value={pct(quality.reviewRate)}
                    hint={`${quality.totalReviewed} marked reviewed / ${quality.totalRecords} rows.`}
                  />
                  <RateTile
                    label="Override rate"
                    value={pct(quality.overrideRate)}
                    hint={`${quality.totalOverridden} overridden / ${quality.totalRecords} rows.`}
                  />
                  <RateTile
                    label="Scope"
                    value={quality.scopeUpdatedAtMin ? "Windowed" : "All time"}
                    hint={
                      quality.scopeUpdatedAtMin
                        ? `Since ${quality.scopeUpdatedAtMin}`
                        : "No time filter applied."
                    }
                  />
                </div>
              </section>
            ) : null}

            <section className="space-y-3" data-testid="admin-authority-quality-fo-feedback">
              <h2 className="text-lg font-semibold text-white">FO knowledge feedback</h2>
              {foLoading ? (
                <p className="text-sm text-white/55" data-testid="admin-authority-quality-fo-loading">
                  Loading FO feedback…
                </p>
              ) : null}
              {foError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {foError}
                </div>
              ) : null}
              {!foLoading && !foError && foFeedback == null ? (
                <p className="text-sm text-white/45">Feedback metrics unavailable.</p>
              ) : null}
              {!foLoading && !foError && foFeedback != null && foFeedback.totalCount === 0 ? (
                <p
                  className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-white/50"
                  data-testid="admin-authority-quality-fo-feedback-empty"
                >
                  No franchise-owner feedback in this window.
                </p>
              ) : null}
              {!foLoading && !foError && foFeedback != null && foFeedback.totalCount > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <RateTile
                    label="Total feedback"
                    value={String(foFeedback.totalCount)}
                    hint="Submitted from FO booking screens."
                  />
                  <RateTile
                    label="Helpful rate"
                    value={
                      foFeedback.helpfulRate == null
                        ? "—"
                        : `${(foFeedback.helpfulRate * 100).toFixed(0)}%`
                    }
                    hint={`${foFeedback.helpfulCount} useful · ${foFeedback.notHelpfulCount} not useful.`}
                  />
                  <RateTile
                    label="Undecided"
                    value={String(foFeedback.undecidedCount)}
                    hint="Rows without a useful / not useful choice."
                  />
                  <RateTile
                    label="Top path"
                    value={
                      foFeedback.topSelectedKnowledgePaths[0]?.path?.replace(/^\/+/, "/") ?? "—"
                    }
                    hint="Most-selected knowledge link when provided."
                  />
                </div>
              ) : null}
              {foFeedback && foFeedback.recent.length > 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
                    Recent
                  </p>
                  <ul
                    className="mt-2 space-y-2 text-xs text-white/80"
                    data-testid="admin-authority-quality-fo-feedback-recent"
                  >
                    {foFeedback.recent.slice(0, 8).map((r) => (
                      <li key={r.id} className="flex flex-wrap gap-2 border-t border-white/5 pt-2 first:border-t-0 first:pt-0">
                        <Link
                          href={`/admin/bookings/${r.bookingId}`}
                          className="font-mono text-emerald-200/90 underline decoration-white/20"
                        >
                          {r.bookingId.slice(0, 10)}…
                        </Link>
                        <span className="text-white/45">
                          {r.helpful === true
                            ? "useful"
                            : r.helpful === false
                              ? "not useful"
                              : "undecided"}
                        </span>
                        {r.selectedKnowledgePath ? (
                          <span className="font-mono text-white/55">{r.selectedKnowledgePath}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="space-y-3" data-testid="admin-authority-quality-unmapped">
              <h2 className="text-lg font-semibold text-white">Knowledge mapping gaps</h2>
              {unmappedLoading ? (
                <p className="text-sm text-white/55" data-testid="admin-authority-quality-unmapped-loading">
                  Scanning unmapped tags…
                </p>
              ) : null}
              {unmappedError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {unmappedError}
                </div>
              ) : null}
              {!unmappedLoading && !unmappedError && unmapped == null ? (
                <p className="text-sm text-white/45">Unmapped tag scan unavailable.</p>
              ) : null}
              {!unmappedLoading && !unmappedError && unmapped != null && unmapped.items.length === 0 ? (
                <p
                  className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90"
                  data-testid="admin-authority-quality-unmapped-empty"
                >
                  No off-snapshot tags in the scanned authority rows ({unmapped.rowsScanned} of up to{" "}
                  {unmapped.maxRowsScan} rows in scope).
                </p>
              ) : null}
              {!unmappedLoading && !unmappedError && unmapped != null && unmapped.items.length > 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                  <p className="text-xs text-white/50">
                    Tags on saved authority rows that are outside the bundled public snapshot. Sample:
                    up to {unmapped.maxRowsScan} most recently updated rows
                    {unmapped.windowUsed
                      ? ` (${new Date(unmapped.windowUsed.fromIso).toLocaleString()} → ${new Date(unmapped.windowUsed.toIso).toLocaleString()})`
                      : ""}
                    ; scanned {unmapped.rowsScanned} rows.
                  </p>
                  <ul
                    className="mt-3 space-y-1 font-mono text-xs text-white/85"
                    data-testid="admin-authority-quality-unmapped-list"
                  >
                    {unmapped.items.slice(0, 8).map((row) => (
                      <li key={`${row.axis}:${row.tag}`}>
                        {row.axis} · {row.tag}{" "}
                        <span className="text-white/45">({row.bookingCount} bookings)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="space-y-3" data-testid="admin-authority-quality-mismatches">
              <h2 className="text-lg font-semibold text-white">Mismatch mix</h2>
              {!qualityLoading && quality && mismatchEntries.length === 0 ? (
                <p className="text-sm text-white/50">No mismatch records in this scope.</p>
              ) : null}
              {!qualityLoading && quality && mismatchEntries.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-950/95 text-xs uppercase tracking-[0.12em] text-white/45">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Type</th>
                        <th className="px-4 py-2.5 text-right font-medium">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mismatchEntries
                        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                        .map(([type, count]) => (
                          <tr key={type} className="border-t border-white/5">
                            <td className="px-4 py-2 font-mono text-xs text-white/90">{type}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-white/85">
                              {count}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>

            {!qualityLoading && quality && quality.totalRecords > 0 ? (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Top tags on overridden rows</h2>
                <div className="grid gap-4 lg:grid-cols-3">
                  <AdminAuthorityTagCountTable
                    title="Surfaces"
                    subtitle="Frequency among persisted rows with status overridden."
                    rows={quality.topOverriddenSurfaces}
                    testId="admin-authority-quality-top-surf"
                    emptyCopy="No surface tags on overridden rows."
                  />
                  <AdminAuthorityTagCountTable
                    title="Problems"
                    subtitle="Frequency among persisted rows with status overridden."
                    rows={quality.topOverriddenProblems}
                    testId="admin-authority-quality-top-prob"
                    emptyCopy="No problem tags on overridden rows."
                  />
                  <AdminAuthorityTagCountTable
                    title="Methods"
                    subtitle="Frequency among persisted rows with status overridden."
                    rows={quality.topOverriddenMethods}
                    testId="admin-authority-quality-top-meth"
                    emptyCopy="No method tags on overridden rows."
                  />
                </div>
              </section>
            ) : null}

            <section className="space-y-4" data-testid="admin-authority-quality-drift">
              <h2 className="text-lg font-semibold text-white">Drift signals</h2>
              {driftLoading ? (
                <p className="text-sm text-white/55" data-testid="admin-authority-quality-drift-loading">
                  Loading drift summary…
                </p>
              ) : null}
              {driftError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {driftError}
                </div>
              ) : null}
              {!driftLoading && !driftError && drift != null ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
                        Overrides in scope
                      </p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                        {drift.recentOverrideTrendSummary.authorityResultsOverriddenInScope}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
                        Mismatch rows in scope
                      </p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                        {drift.recentOverrideTrendSummary.mismatchRecordsCreatedInScope}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <AdminAuthorityTagCountTable
                      title="Mismatch-heavy problems"
                      subtitle="Co-occurring problem tags on rows with mismatch records."
                      rows={drift.tagsHighestMismatchFrequency.problems}
                      testId="admin-authority-quality-drift-mm-prob"
                      emptyCopy="No mismatch-tagged problems."
                    />
                    <AdminAuthorityTagCountTable
                      title="Override-heavy problems"
                      subtitle="Highest frequency on overridden rows."
                      rows={drift.tagsHighestOverrideFrequency.problems}
                      testId="admin-authority-quality-drift-ov-prob"
                      emptyCopy="No overridden problem tags."
                    />
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <h3 className="text-sm font-semibold text-white">Repeated activity</h3>
                    <p className="mt-1 text-xs text-white/45">
                      Bookings with multiple mismatch records (same scope).
                    </p>
                    <ul className="mt-3 space-y-2 text-xs text-white/80">
                      {drift.bookingsWithRepeatedMismatchActivity.length === 0 ? (
                        <li className="text-white/45">None detected.</li>
                      ) : (
                        drift.bookingsWithRepeatedMismatchActivity.slice(0, 8).map((b) => (
                          <li key={b.bookingId} className="font-mono">
                            <Link
                              href={`/admin/bookings/${b.bookingId}`}
                              className="text-emerald-200/90 underline decoration-white/20 underline-offset-2 hover:text-white"
                            >
                              {b.bookingId}
                            </Link>{" "}
                            <span className="text-white/50">×{b.mismatchCount}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
                </>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
