"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchAdminAuthorityAlerts,
  type AuthorityAlertActionHints,
  type AuthorityAlertItem,
  type BookingAuthorityAlertsPayload,
} from "@/lib/api/adminAuthorityAlerts";
import { AUTHORITY_ADMIN_DEFAULT_WINDOW_HOURS } from "@/lib/admin/authorityAdminDefaults";
import { buildAuthorityAlertDestinationHref } from "@/lib/admin/authorityAdminUrlParams";
import { WEB_ENV } from "@/lib/env";
import { getStoredAccessToken } from "@/lib/auth";

const API_BASE = WEB_ENV.apiBaseUrl;

function AlertActionBlock(props: {
  hints?: AuthorityAlertActionHints | null;
  windowUsed: AuthorityAlertItem["windowUsed"];
}) {
  const { hints, windowUsed } = props;
  const ids = hints?.affectedBookingIds?.filter(Boolean) ?? [];
  const hasPath = Boolean(hints?.suggestedAdminPath?.trim());
  const destinationHref =
    hasPath && hints?.suggestedAdminPath
      ? buildAuthorityAlertDestinationHref(hints.suggestedAdminPath, hints, windowUsed)
      : "";
  if (!hasPath && ids.length === 0) {
    return (
      <p className="mt-2 text-[11px] text-white/35" data-testid="admin-authority-alert-no-actions">
        No quick links for this alert.
      </p>
    );
  }
  return (
    <div
      className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3 text-[11px]"
      data-testid="admin-authority-alert-actions"
    >
      {hasPath ? (
        <Link
          href={destinationHref}
          className="inline-flex w-fit font-semibold text-emerald-200/95 underline decoration-white/25 underline-offset-4 hover:text-white"
          data-testid="admin-authority-alert-suggested-path"
        >
          View related authority results
        </Link>
      ) : null}
      {ids.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white/60">
          <span className="font-medium text-white/45">View affected bookings</span>
          {ids.slice(0, 5).map((id) => (
            <Link
              key={id}
              href={`/admin/bookings/${id}`}
              className="max-w-[10rem] truncate font-mono text-[10px] text-emerald-200/90 underline decoration-white/20 underline-offset-2 hover:text-white"
              data-testid="admin-authority-alert-booking-link"
              title={id}
            >
              {id}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function severityStyle(s: AuthorityAlertItem["severity"]) {
  if (s === "high") return "border-red-500/40 bg-red-500/10 text-red-50";
  if (s === "medium") return "border-amber-500/35 bg-amber-500/10 text-amber-50";
  return "border-white/15 bg-white/[0.04] text-white/90";
}

export function AdminAuthorityAlertsClient() {
  const rawSearchParams = useSearchParams();
  const searchParams = rawSearchParams ?? new URLSearchParams();
  const alertScope = useMemo(() => {
    const updatedSince = searchParams.get("updatedSince")?.trim();
    const whRaw = searchParams.get("windowHours");
    const windowHours =
      whRaw != null && /^\d+$/.test(whRaw)
        ? parseInt(whRaw, 10)
        : AUTHORITY_ADMIN_DEFAULT_WINDOW_HOURS;
    return { updatedSince: updatedSince || undefined, windowHours };
  }, [searchParams]);

  const [data, setData] = useState<BookingAuthorityAlertsPayload | null>(null);
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
      const d = await fetchAdminAuthorityAlerts(API_BASE, token, {
        windowHours: alertScope.updatedSince ? undefined : alertScope.windowHours,
        updatedSince: alertScope.updatedSince,
      });
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load alerts.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [alertScope.updatedSince, alertScope.windowHours]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main
      className="min-h-screen bg-neutral-950 px-6 py-12 text-white"
      data-testid="admin-authority-alerts-page"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Admin · Operations
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Authority alerts</h1>
          <p className="text-sm text-white/65">
            Threshold-based checks over a rolling window (
            <code className="rounded bg-black/40 px-1 text-xs text-emerald-100/90">
              GET /api/v1/admin/authority/alerts
            </code>
            ).
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-white/55" data-testid="admin-authority-alerts-loading">
            Evaluating alerts…
          </p>
        ) : null}

        {!loading && data ? (
          <div className="space-y-4">
            <div
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/55"
              data-testid="admin-authority-alerts-window"
            >
              <p>
                <span className="text-white/40">Window:</span>{" "}
                {new Date(data.windowUsed.fromIso).toLocaleString()} →{" "}
                {new Date(data.windowUsed.toIso).toLocaleString()}
              </p>
              <p className="mt-1 text-[0.65rem] text-white/35">
                Thresholds: min sample {data.thresholdsUsed.minSampleSize}, override ≥{" "}
                {(data.thresholdsUsed.overrideRateHighThreshold * 100).toFixed(0)}%, review ≤{" "}
                {(data.thresholdsUsed.reviewRateLowThreshold * 100).toFixed(0)}%, mismatch/type ≥{" "}
                {data.thresholdsUsed.mismatchTypeMinCount}, unstable score ≥{" "}
                {data.thresholdsUsed.unstableTagScoreMin}
              </p>
            </div>

            {data.alerts.length === 0 ? (
              <p
                className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100/90"
                data-testid="admin-authority-alerts-empty"
              >
                No authority alerts fired for this window.
              </p>
            ) : (
              <ul className="space-y-3" data-testid="admin-authority-alerts-list">
                {data.alerts.map((a) => (
                  <li
                    key={`${a.alertType}-${a.evidenceSummary.slice(0, 40)}`}
                    className={`rounded-2xl border px-4 py-3 ${severityStyle(a.severity)}`}
                  >
                    <p className="text-[0.65rem] font-medium uppercase tracking-wide text-white/50">
                      {a.alertType.replace(/_/g, " ")} · {a.severity}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{a.evidenceSummary}</p>
                    <AlertActionBlock hints={a.actionHints} windowUsed={a.windowUsed} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
