"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { BookingAuthorityReviewStatus } from "@/lib/api/adminBookingCommandCenter";
import {
  fetchAdminAuthorityReport,
  fetchAdminAuthorityResultsList,
  type BookingAuthorityReportPayload,
  type BookingAuthorityReportTagRow,
  type BookingAuthorityResultsListPayload,
} from "@/lib/api/adminAuthorityReport";
import { AUTHORITY_ADMIN_DEFAULT_WINDOW_HOURS } from "@/lib/admin/authorityAdminDefaults";
import { parseAuthorityAdminSearchParams } from "@/lib/admin/authorityAdminUrlParams";
import { WEB_ENV } from "@/lib/env";
import { getStoredAccessToken } from "@/lib/auth";

const API_BASE = WEB_ENV.apiBaseUrl;

type ListStatusFilter = "" | BookingAuthorityReviewStatus;

function formatTagPreview(tags: string[], max = 3): string {
  if (!tags.length) return "—";
  const head = tags.slice(0, max);
  const extra = tags.length - head.length;
  return extra > 0 ? `${head.join(", ")} +${extra}` : head.join(", ");
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function StatusTile(props: { label: string; value: number; hint: string }) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5"
      title={props.hint}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
        {props.label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
        {props.value}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-white/40">{props.hint}</p>
    </div>
  );
}

function TopTagsTable(props: {
  title: string;
  subtitle: string;
  rows: BookingAuthorityReportTagRow[];
  testId: string;
  highlightTag?: string | null;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/20"
      data-testid={props.testId}
    >
      <div className="border-b border-white/10 px-4 py-3.5">
        <h3 className="text-sm font-semibold text-white">{props.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-white/45">
          {props.subtitle}
        </p>
      </div>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-[1] bg-neutral-950/95 text-xs uppercase tracking-[0.12em] text-white/45">
            <tr>
              <th className="px-4 py-2.5 font-medium">Tag slug</th>
              <th className="px-4 py-2.5 text-right font-medium">Bookings</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-8 text-center text-sm leading-relaxed text-white/45"
                >
                  No tags in this category for persisted rows.
                </td>
              </tr>
            ) : (
              props.rows.map((row) => {
                const hi =
                  props.highlightTag != null &&
                  props.highlightTag.trim() !== "" &&
                  row.tag === props.highlightTag.trim();
                return (
                <tr
                  key={row.tag}
                  className={`border-t border-white/5 hover:bg-white/[0.03] ${hi ? "bg-amber-500/10 ring-1 ring-inset ring-amber-400/35" : ""}`}
                  data-highlighted={hi ? "true" : undefined}
                >
                  <td className="px-4 py-2 font-mono text-xs text-white/90">
                    {row.tag}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-white/85">
                    {row.bookingCount}
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminAuthorityReportClient() {
  const rawSearchParams = useSearchParams();
  const searchParams = rawSearchParams ?? new URLSearchParams();
  const qKey = searchParams.toString();
  const parsed = useMemo(
    () => parseAuthorityAdminSearchParams(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qKey],
  );

  const [data, setData] = useState<BookingAuthorityReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<ListStatusFilter>("");
  const [listData, setListData] = useState<BookingAuthorityResultsListPayload | null>(
    null,
  );
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    const s = parsed.authorityStatus;
    if (s === "auto" || s === "reviewed" || s === "overridden") {
      setListFilter(s);
    }
  }, [parsed.authorityStatus]);

  const loadReport = useCallback(async () => {
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
      const reportParams: {
        topLimit: number;
        recentLimit: number;
        windowHours?: number;
        updatedSince?: string;
      } = {
        topLimit: 25,
        recentLimit: 0,
      };
      if (parsed.updatedSince?.trim()) {
        reportParams.updatedSince = parsed.updatedSince.trim();
      } else if (parsed.windowHours?.trim() && /^\d+$/.test(parsed.windowHours)) {
        reportParams.windowHours = parseInt(parsed.windowHours, 10);
      } else {
        reportParams.windowHours = AUTHORITY_ADMIN_DEFAULT_WINDOW_HOURS;
      }
      const report = await fetchAdminAuthorityReport(API_BASE, token, reportParams);
      setData(report);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load authority report.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [parsed.updatedSince, parsed.windowHours]);

  const loadList = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setListData(null);
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const rows = await fetchAdminAuthorityResultsList(API_BASE, token, {
        limit: 50,
        offset: 0,
        ...(listFilter ? { status: listFilter } : {}),
      });
      setListData(rows);
    } catch (e) {
      setListData(null);
      setListError(
        e instanceof Error ? e.message : "Failed to load persisted rows.",
      );
    } finally {
      setListLoading(false);
    }
  }, [listFilter]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const focusBookingSet = useMemo(
    () => new Set(parsed.focusBookingIds),
    [parsed.focusBookingIds],
  );

  useEffect(() => {
    if (!getStoredAccessToken()) return;
    void loadList();
  }, [loadList]);

  return (
    <main
      className="min-h-screen bg-neutral-950 px-6 py-12 text-white"
      data-testid="admin-authority-report-page"
    >
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Admin · Operations
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Booking authority report
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-white/65">
            Persisted classifier tags only — surfaces, problems, and methods stored on bookings (
            <code className="rounded bg-black/40 px-1 py-0.5 text-xs text-emerald-100/90">
              GET /api/v1/admin/authority/report
            </code>
            ).
          </p>
          {parsed.authorityTag ||
          parsed.authorityMismatchType ||
          focusBookingSet.size > 0 ||
          parsed.authorityStatus ? (
            <p
              className="max-w-3xl text-xs text-amber-100/80"
              data-testid="admin-authority-report-alert-filters"
            >
              Alert deep-link filters active
              {parsed.authorityStatus ? ` · status: ${parsed.authorityStatus}` : ""}
              {parsed.authorityTag ? ` · tag: ${parsed.authorityTag}` : ""}
              {parsed.authorityMismatchType
                ? ` · mismatch: ${parsed.authorityMismatchType} (see Quality for counts)`
                : ""}
              {focusBookingSet.size > 0
                ? ` · ${focusBookingSet.size} booking(s) focused in the table below`
                : ""}
              .
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-white/55">Loading authority report…</p>
        ) : null}

        {!loading && data ? (
          <div className="space-y-10">
            <section
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-7"
              data-testid="admin-authority-report-summary"
            >
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Review pipeline
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                    How many persisted authority rows are auto-classified, reviewed, or overridden.
                    Generated {formatDateTime(data.generatedAt)} ·{" "}
                    <span data-testid="admin-authority-report-total-records">
                      {data.totalRecords}
                    </span>{" "}
                    persisted rows
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatusTile
                  label="Auto"
                  value={data.countsByStatus.auto}
                  hint="Classifier saved; no formal review yet."
                />
                <StatusTile
                  label="Reviewed"
                  value={data.countsByStatus.reviewed}
                  hint="A reviewer confirmed the saved tags."
                />
                <StatusTile
                  label="Overridden"
                  value={data.countsByStatus.overridden}
                  hint="Tags were set or changed by an admin."
                />
              </div>
            </section>

            <section
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-7"
              data-testid="admin-authority-report-row-list"
            >
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white">
                    Persisted rows
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                    Sample of booking authority records (newest updates first). Use the status
                    filter to match the review pipeline above.
                  </p>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
                    Status filter
                  </span>
                  <select
                    aria-label="Filter persisted rows by review status"
                    data-testid="admin-authority-report-status-filter"
                    className="min-w-[11rem] rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                    value={listFilter}
                    disabled={loading || !!error}
                    onChange={(e) =>
                      setListFilter(e.target.value as ListStatusFilter)
                    }
                  >
                    <option value="">All statuses</option>
                    <option value="auto">Auto</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="overridden">Overridden</option>
                  </select>
                </label>
              </div>

              {listError ? (
                <p className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm text-amber-100/90">
                  {listError}
                </p>
              ) : null}

              {listLoading ? (
                <p className="text-sm text-white/50">Loading persisted rows…</p>
              ) : null}

              {!listLoading && listData ? (
                <>
                  {(() => {
                    const visibleItems =
                      focusBookingSet.size > 0
                        ? listData.items.filter((i) => focusBookingSet.has(i.bookingId))
                        : listData.items;
                    return (
                      <>
                  <p className="mb-3 text-xs text-white/45">
                    Showing {visibleItems.length} of {listData.total} matching rows
                    {listFilter ? ` (${listFilter})` : ""}
                    {focusBookingSet.size > 0 ? " · alert booking focus" : ""}.
                  </p>
                  {listData.items.length === 0 ? (
                    <p
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-4 text-center text-sm text-white/45"
                      data-testid="admin-authority-report-row-list-empty"
                    >
                      No persisted rows for this status filter.
                    </p>
                  ) : visibleItems.length === 0 ? (
                    <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-4 text-center text-sm text-amber-100/90">
                      No rows in this sample match the focused booking IDs. Try clearing filters or
                      widening the time window.
                    </p>
                  ) : (
                    <div className="max-h-[28rem] overflow-auto rounded-xl border border-white/10">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 z-[1] bg-neutral-950/95 text-xs uppercase tracking-[0.12em] text-white/45">
                          <tr>
                            <th className="px-3 py-2.5 font-medium">Booking</th>
                            <th className="px-3 py-2.5 font-medium">Status</th>
                            <th className="px-3 py-2.5 font-medium">Surfaces</th>
                            <th className="px-3 py-2.5 font-medium">Problems</th>
                            <th className="px-3 py-2.5 font-medium">Methods</th>
                            <th className="px-3 py-2.5 font-medium">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleItems.map((row) => {
                            const hi = focusBookingSet.has(row.bookingId);
                            return (
                            <tr
                              key={row.bookingId}
                              className={`border-t border-white/5 hover:bg-white/[0.03] ${hi ? "bg-amber-500/10 ring-1 ring-inset ring-amber-400/30" : ""}`}
                              data-alert-focus={hi ? "true" : undefined}
                            >
                              <td className="px-3 py-2 align-top">
                                <Link
                                  href={`/admin/bookings/${row.bookingId}`}
                                  className="font-mono text-xs text-emerald-200/90 underline decoration-emerald-500/30 underline-offset-2 hover:decoration-emerald-400/60"
                                >
                                  {row.bookingId}
                                </Link>
                              </td>
                              <td className="px-3 py-2 align-top text-white/85">
                                {row.status}
                              </td>
                              <td className="max-w-[10rem] px-3 py-2 align-top font-mono text-xs text-white/75">
                                {formatTagPreview(row.surfaces)}
                              </td>
                              <td className="max-w-[10rem] px-3 py-2 align-top font-mono text-xs text-white/75">
                                {formatTagPreview(row.problems)}
                              </td>
                              <td className="max-w-[10rem] px-3 py-2 align-top font-mono text-xs text-white/75">
                                {formatTagPreview(row.methods)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 align-top text-xs text-white/55">
                                {formatDateTime(row.updatedAt)}
                              </td>
                            </tr>
                          );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                      </>
                    );
                  })()}
                </>
              ) : null}
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-white">
                Tag frequency
              </h2>
              <p className="mb-4 text-xs leading-relaxed text-white/45">
                Most common slugs across persisted booking rows (top N from the API).
              </p>
              <div className="grid gap-4 lg:grid-cols-3">
                <TopTagsTable
                  title="Surfaces"
                  subtitle="Surface slugs by number of bookings."
                  rows={data.topSurfaces}
                  testId="admin-authority-report-top-surfaces"
                  highlightTag={
                    parsed.authorityTagAxis?.trim() === "surface" || !parsed.authorityTagAxis?.trim()
                      ? parsed.authorityTag?.trim() ?? null
                      : null
                  }
                />
                <TopTagsTable
                  title="Problems"
                  subtitle="Problem slugs by number of bookings."
                  rows={data.topProblems}
                  testId="admin-authority-report-top-problems"
                  highlightTag={
                    parsed.authorityTagAxis?.trim() === "problem" || !parsed.authorityTagAxis?.trim()
                      ? parsed.authorityTag?.trim() ?? null
                      : null
                  }
                />
                <TopTagsTable
                  title="Methods"
                  subtitle="Method slugs by number of bookings."
                  rows={data.topMethods}
                  testId="admin-authority-report-top-methods"
                  highlightTag={
                    parsed.authorityTagAxis?.trim() === "method" || !parsed.authorityTagAxis?.trim()
                      ? parsed.authorityTag?.trim() ?? null
                      : null
                  }
                />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
