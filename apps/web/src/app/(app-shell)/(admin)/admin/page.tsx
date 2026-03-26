"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminActivityFeed } from "@/components/admin/activity/AdminActivityFeed";
import { AdminAnomaliesQueue } from "@/components/admin/anomalies/AdminAnomaliesQueue";
import { AdminLaunchReadinessCard } from "@/components/admin/AdminLaunchReadinessCard";
import { AdminBookingRevenueReadinessCard } from "@/components/admin/AdminBookingRevenueReadinessCard";
import { AdminOpsAnomaliesPanel } from "@/components/admin/AdminOpsAnomaliesPanel";
import { WEB_ENV } from "@/lib/env";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
} from "@/lib/auth";

type DispatchExceptionItem = {
  bookingId: string;
  status: string;
  createdAt: string;
  reasons: string[];
};

type AdminActivityItem = {
  id: string;
  type: string;
  bookingId?: string | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

const API_BASE_URL = WEB_ENV.apiBaseUrl;

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatReasons(reasons: string[]) {
  if (!reasons.length) return "—";
  return reasons.join(", ");
}

function DashboardShell(props: { children: ReactNode }) {
  return <div className="space-y-6">{props.children}</div>;
}

function DashboardCard(props: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {props.eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {props.eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-xl font-semibold text-slate-50">
            {props.title}
          </h2>
        </div>
        {props.actions ? <div>{props.actions}</div> : null}
      </div>
      {props.children}
    </section>
  );
}

/** Maps GET /api/v1/admin/dispatch/exceptions items (DTO) to dashboard rows. */
function mapDispatchExceptionApiItem(
  item: Record<string, unknown>,
): DispatchExceptionItem {
  const bookingId = String(item.bookingId ?? "");
  const status =
    (item.bookingStatus != null ? String(item.bookingStatus) : null) ??
    (item.status != null ? String(item.status) : null) ??
    "—";
  const createdAt =
    (item.latestCreatedAt != null ? String(item.latestCreatedAt) : "") ||
    (item.createdAt != null ? String(item.createdAt) : "") ||
    "";
  const rawReasons = item.exceptionReasons ?? item.reasons;
  const reasons = Array.isArray(rawReasons)
    ? rawReasons.map((r) => String(r))
    : [];

  return { bookingId, status, createdAt, reasons };
}

/** Maps GET /api/v1/admin/activity items to dashboard rows. */
function mapAdminActivityApiItem(
  item: Record<string, unknown>,
  index: number,
): AdminActivityItem {
  const id =
    item.id != null && String(item.id).trim()
      ? String(item.id)
      : `${String(item.type ?? "activity")}-${String(item.createdAt ?? index)}`;

  const actorRaw =
    item.actorAdminUserId ?? item.actorUserId ?? item.actorAdminUserID;
  const metadata = item.metadata;
  const metaObj =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : null;

  return {
    id,
    type: String(item.type ?? "unknown"),
    bookingId:
      item.bookingId != null && item.bookingId !== ""
        ? String(item.bookingId)
        : null,
    actorUserId:
      actorRaw != null && String(actorRaw).trim() ? String(actorRaw) : null,
    metadata: metaObj,
    createdAt: String(item.createdAt ?? ""),
  };
}

export default function AdminPage() {
  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exceptions, setExceptions] = useState<DispatchExceptionItem[]>([]);
  const [activity, setActivity] = useState<AdminActivityItem[]>([]);

  useEffect(() => {
    const nextToken = getStoredAccessToken();
    setToken(nextToken);
    setTokenChecked(true);
  }, []);

  useEffect(() => {
    if (!tokenChecked || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        const [exceptionsResponse, activityResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/admin/dispatch/exceptions?limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(`${API_BASE_URL}/api/v1/admin/activity?limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);

        if (!exceptionsResponse.ok) {
          throw new Error(
            `Dispatch exceptions request failed: ${exceptionsResponse.status}`,
          );
        }

        if (!activityResponse.ok) {
          throw new Error(
            `Admin activity request failed: ${activityResponse.status}`,
          );
        }

        const exceptionsPayload = (await exceptionsResponse.json()) as {
          items?: Record<string, unknown>[];
        };

        const activityPayload = (await activityResponse.json()) as {
          items?: Record<string, unknown>[];
        };

        if (cancelled) return;

        setExceptions(
          (exceptionsPayload.items ?? []).map(mapDispatchExceptionApiItem),
        );

        setActivity(
          (activityPayload.items ?? []).map((row, i) =>
            mapAdminActivityApiItem(row, i),
          ),
        );
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load admin dashboard",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked]);

  const hasToken = useMemo(() => Boolean(token), [token]);

  const shell = (inner: ReactNode) => (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">{inner}</div>
    </main>
  );

  if (!tokenChecked) {
    return shell(
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-slate-300">
        Checking admin authentication...
      </div>,
    );
  }

  if (!hasToken) {
    return shell(
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6 text-amber-100">
        <p className="text-lg font-semibold">Authentication required</p>
        <p className="mt-2 text-sm text-amber-100/80">
          Sign in as an admin to access the Servelink control center.
        </p>
        <Link
          href="/admin/auth?next=/admin"
          className="mt-4 inline-flex rounded-xl border border-amber-300/20 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-50"
        >
          Go to admin sign in
        </Link>
      </div>,
    );
  }

  return shell(
    <DashboardShell>
      <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Servelink admin
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-50">
              Operations control center
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Unified launch readiness, revenue readiness, operational exceptions,
              dispatch visibility, and admin activity in one dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/knowledge-review"
              title="Review weak scenarios, SOPs, and timing signals."
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Knowledge Review
            </Link>
            <Link
              href="/admin/anomalies"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Open anomalies
            </Link>
            <Link
              href="/admin/activity"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              View activity
            </Link>
            <Link
              href="/admin/system-tests"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              System tests
            </Link>
            <Link
              href="/admin/booking-direction-intakes"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Booking intakes
            </Link>
            <Link
              href="/admin/exceptions"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Dispatch exceptions
            </Link>
            <Link
              href="/admin/authority"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
              data-testid="admin-dashboard-authority-intel"
            >
              Authority intelligence
            </Link>
            <Link
              href="/admin/deep-clean/analytics"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Deep Clean Analytics
            </Link>
            <Link
              href="/admin/deep-clean/insights"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Deep Clean Insights
            </Link>
            <Link
              href="/admin/deep-clean/estimator"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Deep Clean Estimator
            </Link>
            <Link
              href="/admin/deep-clean/estimator-impact"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Estimator impact
            </Link>
            <Link
              href="/admin/deep-clean/estimator-governance"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Estimator governance
            </Link>
            <button
              type="button"
              onClick={() => {
                clearStoredAccessToken();
                window.location.reload();
              }}
              className="rounded-xl border border-red-400/20 bg-red-500/15 px-4 py-2 text-sm font-medium text-red-100"
            >
              Clear token
            </button>
          </div>
        </div>
      </section>

      <DashboardCard
        eyebrow="Quality"
        title="System tests"
        actions={
          <Link
            href="/admin/system-tests"
            className="text-sm font-medium text-slate-300 hover:text-white"
          >
            Open dashboard
          </Link>
        }
      >
        <p className="text-sm text-slate-400">
          Hosted Playwright ingestion, run history, and failure diagnostics. Ingest runs via CI or{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs text-slate-300">
            POST /api/v1/admin/system-tests/report
          </code>
          .
        </p>
      </DashboardCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminLaunchReadinessCard />
        <AdminBookingRevenueReadinessCard />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminOpsAnomaliesPanel />
        <AdminAnomaliesQueue />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardCard
          eyebrow="Dispatch"
          title="Recent dispatch exceptions"
          actions={
            <Link
              href="/admin/exceptions"
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              View all
            </Link>
          }
        >
          {loading ? (
            <div className="text-sm text-slate-400">
              Loading dispatch exceptions...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : exceptions.length ? (
            <div className="space-y-3">
              {exceptions.map((item) => (
                <Link
                  key={`${item.bookingId}-${item.createdAt}`}
                  href={`/admin/bookings/${item.bookingId}`}
                  className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        Booking {item.bookingId}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {item.status}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {formatReasons(item.reasons)}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              No recent dispatch exceptions.
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          eyebrow="Operations"
          title="Recent admin activity"
          actions={
            <Link
              href="/admin/activity"
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              View all
            </Link>
          }
        >
          {loading ? (
            <div className="text-sm text-slate-400">Loading admin activity...</div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : activity.length ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {item.type}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Booking: {item.bookingId ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Actor: {item.actorUserId ?? "—"}
                      </p>
                      {item.metadata ? (
                        <pre className="mt-2 overflow-auto rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-slate-400">
                          {JSON.stringify(item.metadata, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              No recent admin activity.
            </div>
          )}
        </DashboardCard>
      </div>

      <DashboardCard eyebrow="Navigation" title="Admin surfaces">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <Link
            href="/admin/anomalies"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Anomalies</p>
            <p className="mt-1 text-sm text-slate-400">
              Launch readiness, revenue readiness, ops anomalies, and queue views.
            </p>
          </Link>

          <Link
            href="/admin/exceptions"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Exceptions</p>
            <p className="mt-1 text-sm text-slate-400">
              Dispatch exception review and operational follow-up.
            </p>
          </Link>

          <Link
            href="/admin/deep-clean/analytics"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Deep Clean Analytics</p>
            <p className="mt-1 text-sm text-slate-400">
              Calibration variance, operator notes, and booking drill-down.
            </p>
          </Link>

          <Link
            href="/admin/deep-clean/insights"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Deep Clean Insights</p>
            <p className="mt-1 text-sm text-slate-400">
              Reviewed reason tags, feedback buckets, and program-type variance patterns.
            </p>
          </Link>

          <Link
            href="/admin/deep-clean/estimator"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Deep Clean Estimator</p>
            <p className="mt-1 text-sm text-slate-400">
              Versioned draft/active tuning, preview, and publish (future estimates only).
            </p>
          </Link>

          <Link
            href="/admin/deep-clean/estimator-impact"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Estimator impact</p>
            <p className="mt-1 text-sm text-slate-400">
              Compare calibration outcomes by estimator version with impact analysis and cross-links to governance
              decision intelligence.
            </p>
          </Link>

          <Link
            href="/admin/deep-clean/estimator-governance"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Estimator governance</p>
            <p className="mt-1 text-sm text-slate-400">
              Version history, restore prior configs to draft, rollback readiness, and decision intelligence vs
              impact.
            </p>
          </Link>

          <Link
            href="/admin/deep-clean/estimator-monitoring"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Estimator monitoring</p>
            <p className="mt-1 text-sm text-slate-400">
              Open alerts, trend buckets, and recommendations alongside governance rollback context.
            </p>
          </Link>

          <Link
            href="/admin/activity"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Activity</p>
            <p className="mt-1 text-sm text-slate-400">
              Review recent operator and admin system activity.
            </p>
          </Link>

          <Link
            href="/admin/system-tests"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">System tests</p>
            <p className="mt-1 text-sm text-slate-400">
              Playwright run ingest, pass rate, failures, and per-run diagnostics.
            </p>
          </Link>

          <Link
            href="/admin/exceptions"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Bookings</p>
            <p className="mt-1 text-sm text-slate-400">
              Open a booking from dispatch exceptions, then use command center.
            </p>
          </Link>
        </div>
      </DashboardCard>

      <DashboardCard eyebrow="Feed" title="Detailed activity feed">
        <AdminActivityFeed />
      </DashboardCard>
    </DashboardShell>,
  );
}
