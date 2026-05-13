"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { AdminActivityFeed } from "@/components/admin/activity/AdminActivityFeed";
import { AdminAnomaliesQueue } from "@/components/admin/anomalies/AdminAnomaliesQueue";
import { AdminLaunchReadinessCard } from "@/components/admin/AdminLaunchReadinessCard";
import { AdminBookingRevenueReadinessCard } from "@/components/admin/AdminBookingRevenueReadinessCard";
import { AdminOpsAnomaliesPanel } from "@/components/admin/AdminOpsAnomaliesPanel";
import { AdminApprovalQueueSummaryStrip } from "@/components/admin/AdminApprovalQueueSummaryStrip";
import { AdminPortfolioOrchestrationStrip } from "@/components/admin/AdminPortfolioOrchestrationStrip";
import { AdminOperationalAttentionBoard } from "@/components/admin/AdminOperationalAttentionBoard";
import { AdminOperationalIncidentCommandRail } from "@/components/admin/AdminOperationalIncidentCommandRail";
import { AdminOperationalInvestigationContinuityStrip } from "@/components/admin/AdminOperationalInvestigationContinuityStrip";
import { AdminOperationalInvestigationWorkspacePanel } from "@/components/admin/AdminOperationalInvestigationWorkspacePanel";
import { AdminOperationalSituationCockpit } from "@/components/admin/AdminOperationalSituationCockpit";
import { AdminOperationalPressureHeatStrip } from "@/components/admin/AdminOperationalPressureHeatStrip";
import { AdminOperationalRapidInvestigationZones } from "@/components/admin/AdminOperationalRapidInvestigationZones";
import { AdminOperationalGraphRelationshipStrip } from "@/components/admin/AdminOperationalGraphRelationshipStrip";
import { AdminOperationalGraphExplorer } from "@/components/admin/AdminOperationalGraphExplorer";
import { AdminOperationalGraphTopologyView } from "@/components/admin/AdminOperationalGraphTopologyView";
import { AdminOperationalGraphCollaborationAnnotations } from "@/components/admin/AdminOperationalGraphCollaborationAnnotations";
import { AdminOperationalPresenceRibbon } from "@/components/admin/AdminOperationalPresenceRibbon";
import { AdminOperationalSubstrateNavigationStrip } from "@/components/admin/AdminOperationalSubstrateNavigationStrip";
import { AdminOperationalRealitySynthesisPanel } from "@/components/admin/AdminOperationalRealitySynthesisPanel";
import { AdminOperationalScienceGlanceStrip } from "@/components/admin/AdminOperationalScienceGlanceStrip";
import { AdminOperationalOutboxCommandGuidanceStrip } from "@/components/admin/AdminOperationalOutboxCommandGuidanceStrip";
import { AdminOperationalEscalationCoordinationStrip } from "@/components/admin/AdminOperationalEscalationCoordinationStrip";
import { AdminOperationalTacticalContinuityStrip } from "@/components/admin/AdminOperationalTacticalContinuityStrip";
import { AdminOperationalReplayTimelineStrip } from "@/components/admin/AdminOperationalReplayTimelineStrip";
import { AdminOperationalReplayExplorerStrip } from "@/components/admin/AdminOperationalReplayExplorerStrip";
import { AdminOperationalInterventionReplayRail } from "@/components/admin/AdminOperationalInterventionReplayRail";
import { AdminOperationalReplaySuiteStrip } from "@/components/admin/AdminOperationalReplaySuiteStrip";
import { AdminOperationalReplayAnalysisStrip } from "@/components/admin/AdminOperationalReplayAnalysisStrip";
import { AdminOperationalReplayReviewPanel } from "@/components/admin/AdminOperationalReplayReviewPanel";
import { AdminOperationalIntelligenceStrip } from "@/components/admin/AdminOperationalIntelligenceStrip";
import {
  fetchAdminOperationalIntelligenceDashboard,
  type AdminOperationalIntelligenceDashboard,
} from "@/lib/api/operationalIntelligence";
import { publishOperationalGraphFocus } from "@/lib/operational/operationalRealtimePresenceBridge";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";
import { WEB_ENV } from "@/lib/env";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
} from "@/lib/auth";
import { fetchDispatchExceptionActions } from "@/lib/api/dispatchExceptionActions";
import type {
  OpsCronHealthSnapshot,
  OpsSummaryResponse,
} from "@/lib/api/adminOps";
import type {
  AdminPaymentAnomalyRow,
  AdminPaymentOpsSummary,
  BookingRecord,
} from "@/lib/bookings/bookingApiTypes";
import { displayBookingPrice } from "@/lib/bookings/bookingDisplay";
import {
  getAdminPaymentOpsSummary,
  listAdminPaymentAnomalies,
  listBookings,
} from "@/lib/bookings/bookingStore";
import { buildDispatchExceptionKeyFromBookingId } from "@/types/dispatchExceptionActions";

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

type AdminOpsSummary = OpsSummaryResponse["summary"];

type StatusTone = "HEALTHY" | "WARNING" | "CRITICAL";

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

function latestFailureAfterSuccess(
  snapshot: OpsCronHealthSnapshot | null | undefined,
) {
  if (!snapshot?.lastFailureAt) return false;
  if (!snapshot.lastSuccessAt) return true;

  return (
    new Date(snapshot.lastFailureAt).getTime() >
    new Date(snapshot.lastSuccessAt).getTime()
  );
}

function cronStatus(snapshot: OpsCronHealthSnapshot | null | undefined): StatusTone {
  if (!snapshot || snapshot.stale) return "CRITICAL";
  if (latestFailureAfterSuccess(snapshot)) return "WARNING";
  return "HEALTHY";
}

function slotHoldStatus(expired: number): StatusTone {
  return expired > 0 ? "WARNING" : "HEALTHY";
}

function statusClass(status: StatusTone) {
  if (status === "CRITICAL") return "border-rose-400/30 bg-rose-500/15 text-rose-100";
  if (status === "WARNING") return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
}

function DashboardShell(props: { children: ReactNode }) {
  return (
    <div className="space-y-4 scroll-smooth md:space-y-6">{props.children}</div>
  );
}

function DashboardCard(props: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      role="region"
      aria-label={props.title}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
    >
      {props.eyebrow ? (
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {props.eyebrow}
        </div>
      ) : null}

      <h2 className="mt-1 text-xl font-semibold text-slate-50">
        {props.title}
      </h2>

      <div className="mt-4">{props.children}</div>
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

export function AdminOperationsCommandCenter(props: {
  children?: ReactNode;
  commandSurfaceVariant?: "command_center" | "war_room";
}) {
  const { children, commandSurfaceVariant: surfaceVariantProp } = props;
  const commandSurfaceVariant = surfaceVariantProp ?? "command_center";
  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exceptions, setExceptions] = useState<DispatchExceptionItem[]>([]);
  const [activity, setActivity] = useState<AdminActivityItem[]>([]);
  const [dexActionMetrics, setDexActionMetrics] = useState<{
    active: number;
    unassignedCritical: number;
    needsValidation: number;
    overdue: number;
    dueSoon: number;
    escalationReady: number;
  } | null>(null);

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [paymentOps, setPaymentOps] = useState<AdminPaymentOpsSummary | null>(
    null,
  );
  const [paymentOpsError, setPaymentOpsError] = useState<string | null>(null);
  const [latestPaymentAnomalies, setLatestPaymentAnomalies] = useState<
    AdminPaymentAnomalyRow[]
  >([]);
  const [paymentBookingsLoading, setPaymentBookingsLoading] = useState(true);
  const [opsSummary, setOpsSummary] = useState<AdminOpsSummary | null>(null);
  const [opsSummaryError, setOpsSummaryError] = useState<string | null>(null);

  const [opDashboard, setOpDashboard] =
    useState<AdminOperationalIntelligenceDashboard | null>(null);
  const [opDashboardLoading, setOpDashboardLoading] = useState(false);
  const [opDashboardError, setOpDashboardError] = useState<string | null>(null);

  const [coordinatedGraphNodeId, setCoordinatedGraphNodeId] = useState<
    string | null
  >(null);

  const loadOperationalDashboard = useCallback(async () => {
    if (!token?.trim()) return;
    setOpDashboardLoading(true);
    setOpDashboardError(null);
    try {
      const d = await fetchAdminOperationalIntelligenceDashboard();
      setOpDashboard(d);
    } catch (err) {
      setOpDashboard(null);
      setOpDashboardError(
        err instanceof Error ?
          err.message
        : "Operational dashboard unavailable.",
      );
    } finally {
      setOpDashboardLoading(false);
    }
  }, [token]);

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
    const authToken = token;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);
      setDexActionMetrics(null);

      try {
        const [exceptionsResponse, activityResponse, dexActions] =
          await Promise.all([
            fetch(`${API_BASE_URL}/admin/dispatch/exceptions?limit=10`, {
              headers: { Authorization: `Bearer ${authToken}` },
              cache: "no-store",
            }),
            fetch(`${API_BASE_URL}/admin/activity?limit=10`, {
              headers: { Authorization: `Bearer ${authToken}` },
              cache: "no-store",
            }),
            fetchDispatchExceptionActions(authToken, { limit: 400 }).catch(
              () => null,
            ),
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

        if (dexActions?.items) {
          const activeSt = new Set(["open", "investigating", "waiting"]);
          const rows = dexActions.items;
          const activeRows = rows.filter((r) => activeSt.has(r.status));
          setDexActionMetrics({
            active: activeRows.length,
            unassignedCritical: activeRows.filter(
              (r) => !r.ownerUserId && r.priority === "critical",
            ).length,
            needsValidation: rows.filter(
              (r) =>
                r.status === "resolved" &&
                r.validationState !== "passed",
            ).length,
            overdue: activeRows.filter((r) => r.slaStatus === "overdue").length,
            dueSoon: activeRows.filter((r) => r.slaStatus === "due_soon")
              .length,
            escalationReady: activeRows.filter((r) => r.escalationReadyAt)
              .length,
          });
        } else {
          setDexActionMetrics(null);
        }
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

  useEffect(() => {
    if (!tokenChecked || !token) {
      setOpDashboard(null);
      setOpDashboardError(null);
      return;
    }
    void loadOperationalDashboard();
  }, [tokenChecked, token, loadOperationalDashboard]);

  useEffect(() => {
    if (!tokenChecked || !token) {
      setOpsSummary(null);
      return;
    }

    let cancelled = false;
    const authToken = token;
    setOpsSummaryError(null);

    async function loadOpsSummary() {
      try {
        const response = await fetch(`${API_BASE_URL}/system/ops/summary`, {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Ops summary request failed: ${response.status}`);
        }

        const payload = (await response.json()) as OpsSummaryResponse;
        if (!cancelled) {
          setOpsSummary(payload.summary);
        }
      } catch (err) {
        if (!cancelled) {
          setOpsSummary(null);
          setOpsSummaryError(
            err instanceof Error ? err.message : "Failed to load ops summary.",
          );
        }
      }
    }

    void loadOpsSummary();

    return () => {
      cancelled = true;
    };
  }, [token, tokenChecked]);

  useEffect(() => {
    if (!tokenChecked || !token) {
      setPaymentBookingsLoading(false);
      return;
    }

    let cancelled = false;
    setPaymentBookingsLoading(true);
    setBookingsError(null);
    setPaymentOpsError(null);

    void Promise.allSettled([
      listBookings({ view: "dispatch" }),
      getAdminPaymentOpsSummary(),
      listAdminPaymentAnomalies(),
    ]).then((results) => {
      if (cancelled) return;

      const [bRes, pRes, aRes] = results;

      if (bRes.status === "fulfilled") {
        setBookings(bRes.value);
        setBookingsError(null);
      } else {
        setBookings([]);
        setBookingsError(
          bRes.reason instanceof Error
            ? bRes.reason.message
            : "Failed to load bookings.",
        );
      }

      if (pRes.status === "fulfilled") {
        setPaymentOps(pRes.value);
        setPaymentOpsError(null);
      } else {
        setPaymentOps(null);
        setPaymentOpsError(
          pRes.reason instanceof Error
            ? pRes.reason.message
            : "Failed to load payment operations.",
        );
      }

      if (aRes.status === "fulfilled") {
        setLatestPaymentAnomalies(aRes.value.slice(0, 5));
      } else {
        setLatestPaymentAnomalies([]);
      }

      if (!cancelled) setPaymentBookingsLoading(false);
    });

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
          href="/admin/auth?next=/admin/ops"
          className="mt-4 inline-flex rounded-xl border border-amber-300/20 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-50"
        >
          Go to admin sign in
        </Link>
      </div>,
    );
  }

  return shell(
    <DashboardShell>
      <section
        id="operational-situation-landmark"
        aria-label={
          commandSurfaceVariant === "war_room" ?
            COMMAND_CENTER_UX.warRoomLandmarkTitle
          : COMMAND_CENTER_UX.situationLandmarkTitle
        }
        className="motion-safe:transition-[box-shadow,background-color] motion-safe:duration-300 rounded-2xl border border-teal-400/20 bg-teal-950/25 px-5 py-4 text-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-200/90">
          {commandSurfaceVariant === "war_room" ?
            COMMAND_CENTER_UX.warRoomLandmarkEyebrow
          : COMMAND_CENTER_UX.situationLandmarkTitle}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-50">
          {commandSurfaceVariant === "war_room" ?
            COMMAND_CENTER_UX.warRoomLandmarkTitle
          : "Operations command center"}
        </h1>
        <p className="mt-2 max-w-4xl text-sm text-slate-400">
          {commandSurfaceVariant === "war_room" ?
            COMMAND_CENTER_UX.warRoomLandmarkSubtitle
          : COMMAND_CENTER_UX.situationLandmarkSubtitle}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-slate-500">
          <span>{COMMAND_CENTER_UX.governanceRail}</span>
          {commandSurfaceVariant === "war_room" ?
            <>
              <Link
                href="/admin/ops"
                className="font-medium text-teal-200 underline-offset-2 hover:underline"
              >
                {COMMAND_CENTER_UX.warRoomExitLink}
              </Link>
              <Link
                href="#operational-substrate-navigation-strip"
                className="font-medium text-teal-200 underline-offset-2 hover:underline"
              >
                {COMMAND_CENTER_UX.rapidZoneSubstrateMap}
              </Link>
            </>
          : <>
              <Link
                href="/admin/ops/war-room"
                className="font-medium text-teal-200 underline-offset-2 hover:underline"
              >
                {COMMAND_CENTER_UX.warRoomEnterLink}
              </Link>
              <Link
                href="#operational-substrate-navigation-strip"
                className="font-medium text-teal-200 underline-offset-2 hover:underline"
              >
                {COMMAND_CENTER_UX.rapidZoneSubstrateMap}
              </Link>
            </>}
        </div>
      </section>

      <AdminOperationalPresenceRibbon
        enabled={hasToken}
        commandSurfaceVariant={commandSurfaceVariant}
      />

      <AdminOperationalSubstrateNavigationStrip />

      <AdminOperationalRealitySynthesisPanel
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalInvestigationContinuityStrip />

      <AdminOperationalRapidInvestigationZones />

      <AdminOperationalInvestigationWorkspacePanel />

      <AdminOperationalSituationCockpit
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalPressureHeatStrip
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalAttentionBoard
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalEscalationCoordinationStrip
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalIncidentCommandRail
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalGraphRelationshipStrip
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalGraphExplorer
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
        coordinatedSelectedNodeId={coordinatedGraphNodeId}
        onCoordinatedSelectedNodeIdChange={(id) => {
          setCoordinatedGraphNodeId(id);
          publishOperationalGraphFocus("graph_explorer", id);
        }}
      />

      <AdminOperationalGraphTopologyView
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
        coordinatedSelectedNodeId={coordinatedGraphNodeId}
        onCoordinatedSelectedNodeIdChange={(id) => {
          setCoordinatedGraphNodeId(id);
          publishOperationalGraphFocus("graph_topology", id);
        }}
      />

      <AdminOperationalGraphCollaborationAnnotations
        graphNodeId={coordinatedGraphNodeId}
      />

      <AdminOperationalTacticalContinuityStrip
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalReplayTimelineStrip
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalReplayExplorerStrip
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
        onCompared={loadOperationalDashboard}
      />

      <AdminOperationalReplaySuiteStrip
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalReplayAnalysisStrip
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalReplayReviewPanel />

      <AdminOperationalInterventionReplayRail
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminOperationalScienceGlanceStrip
        dashboard={opDashboard}
        loading={opDashboardLoading}
        error={opDashboardError}
      />

      <AdminPortfolioOrchestrationStrip />
      <AdminApprovalQueueSummaryStrip />
      <AdminOperationalOutboxCommandGuidanceStrip />

      <AdminOperationalIntelligenceStrip
        coordinatedDashboard={opDashboard}
        coordinatedLoading={opDashboardLoading}
        coordinatedError={opDashboardError}
        onCoordinatedReload={loadOperationalDashboard}
      />

      <section
        id="admin-command-secondary-navigation"
        className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Servelink admin
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-50">
              Navigation & deep surfaces
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Secondary navigation — operational posture and intelligence appear above.{" "}
              <Link
                href="#operational-substrate-navigation-strip"
                className="font-medium text-teal-200 underline-offset-2 hover:underline"
              >
                Jump to operational substrate map
              </Link>{" "}
              for every rail anchor.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/encyclopedia/review"
              title="Review encyclopedia pages, quality, and publish policy."
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Encyclopedia Review
            </Link>
            <Link
              href="/admin/encyclopedia/ops"
              title="Weak pages, repair queue, and system health."
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left transition hover:bg-white/[0.14]"
            >
              <div className="text-sm font-semibold text-slate-100">
                Encyclopedia Ops
              </div>
              <div className="mt-1 max-w-[220px] text-xs leading-snug text-slate-400">
                Weak pages, repair queue, and system health
              </div>
            </Link>
            <Link
              href="/admin/knowledge-review"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Knowledge review
            </Link>
            <Link
              href="/admin/knowledge-ops"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Knowledge ops
            </Link>
            <Link
              href="/admin/dispatch-config"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Dispatch config
            </Link>
            <Link
              href="#ops-backlog"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Dispatch backlog
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

      {children}

      <DashboardCard eyebrow="Control layer" title="System Health">
        {opsSummaryError ? (
          <p className="text-sm text-amber-200/90">{opsSummaryError}</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              {
                label: "Payment reconciliation cron",
                snapshot: opsSummary?.cron?.reconciliation,
              },
              {
                label: "Remaining balance auth cron",
                snapshot: opsSummary?.cron?.remainingBalanceAuth,
              },
              {
                label: "Operational analytics warehouse refresh cron",
                snapshot: opsSummary?.cron?.operationalAnalyticsWarehouseRefresh,
              },
            ].map(({ label, snapshot }) => {
              const status = cronStatus(snapshot);
              return (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-100">
                      {label}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(status)}`}
                    >
                      {status}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-2 text-sm text-slate-400">
                    <div className="flex justify-between gap-4">
                      <dt>Last run</dt>
                      <dd className="text-right text-slate-200">
                        {formatDateTime(snapshot?.lastRunAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Last success</dt>
                      <dd className="text-right text-slate-200">
                        {formatDateTime(snapshot?.lastSuccessAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Last failure</dt>
                      <dd className="text-right text-slate-200">
                        {formatDateTime(snapshot?.lastFailureAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </DashboardCard>

      <DashboardCard eyebrow="Scheduling" title="Slot Hold Integrity">
        {opsSummaryError ? (
          <p className="text-sm text-amber-200/90">{opsSummaryError}</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                Read-only view of persisted slot holds plus confirmed hold metrics.
              </p>
              {(() => {
                const expired = opsSummary?.slotHolds?.expired ?? 0;
                const status = slotHoldStatus(expired);
                return (
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(status)}`}
                  >
                    {status}
                  </span>
                );
              })()}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Active holds", opsSummary?.slotHolds?.active ?? 0],
                ["Expired holds", opsSummary?.slotHolds?.expired ?? 0],
                ["Consumed holds", opsSummary?.slotHolds?.consumed ?? 0],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                >
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {label}
                  </div>
                  <div className="mt-1 font-semibold text-slate-50">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DashboardCard>

      <DashboardCard eyebrow="Billing" title="Payment operations">
        {paymentBookingsLoading ? (
          <p className="text-sm text-slate-400">Loading payment metrics…</p>
        ) : paymentOpsError && !paymentOps ? (
          <p className="text-sm text-amber-200/90">{paymentOpsError}</p>
        ) : paymentOps ? (
          <>
            <p className="mb-4 text-sm text-slate-400">
              Single Stripe ingress: webhook health, anomalies, and stuck checkouts
              (read-only; computed on load).
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Open anomalies
                </div>
                <div className="mt-1 font-semibold text-slate-50">
                  {paymentOps.openAnomalyCount}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Webhook failures (24h)
                </div>
                <div className="mt-1 font-semibold text-slate-50">
                  {paymentOps.recentWebhookFailureCount}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Stuck pending (&gt;30m)
                </div>
                <div className="mt-1 font-semibold text-slate-50">
                  {paymentOps.stuckPendingPaymentShortCount}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Duplicate events (7d)
                </div>
                <div className="mt-1 font-semibold text-slate-50">
                  {paymentOps.duplicateWebhookRecentCount}
                </div>
              </div>
            </div>
            {latestPaymentAnomalies.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-200">
                  Latest open anomalies
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {latestPaymentAnomalies.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap gap-x-2 border-b border-white/10 pb-2 last:border-0"
                    >
                      <span className="font-mono text-xs text-slate-500">
                        {a.kind}
                      </span>
                      {a.bookingId ? (
                        <Link
                          href={`/admin/bookings/${encodeURIComponent(a.bookingId)}`}
                          className="text-sky-300 underline"
                        >
                          {a.bookingId.slice(0, 12)}…
                        </Link>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                      <span className="text-slate-400">{a.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-400">No payment summary available.</p>
        )}
      </DashboardCard>

      <DashboardCard eyebrow="Quality" title="System tests">
        <div className="mb-3 flex justify-end">
          <Link
            href="/admin/system-tests"
            className="text-sm font-medium text-slate-300 hover:text-white"
          >
            Open dashboard
          </Link>
        </div>
        <p className="text-sm text-slate-400">
          Hosted Playwright ingestion, run history, and failure diagnostics. Ingest runs via CI or{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs text-slate-300">
            POST /api/v1/admin/system-tests/report
          </code>
          .
        </p>
      </DashboardCard>

      <DashboardCard eyebrow="Dispatch" title="Exception actions (queue)">
        <div className="mb-3 flex justify-end">
          <Link
            href="/admin/exceptions"
            className="text-sm font-medium text-slate-300 hover:text-white"
          >
            Open queue
          </Link>
        </div>
        {dexActionMetrics ?
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/exceptions?preset=active"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Active
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-50">
                {dexActionMetrics.active}
              </p>
            </Link>
            <Link
              href="/admin/exceptions?preset=unassigned-critical"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Unassigned critical
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-100">
                {dexActionMetrics.unassignedCritical}
              </p>
            </Link>
            <Link
              href="/admin/exceptions?needsValidation=1"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Needs validation
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-50">
                {dexActionMetrics.needsValidation}
              </p>
            </Link>
            <Link
              href="/admin/exceptions?preset=sla-overdue"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                SLA overdue
              </p>
              <p className="mt-1 text-2xl font-semibold text-rose-100">
                {dexActionMetrics.overdue}
              </p>
            </Link>
            <Link
              href="/admin/exceptions?preset=sla-due-soon"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Due soon
              </p>
              <p className="mt-1 text-2xl font-semibold text-orange-100">
                {dexActionMetrics.dueSoon}
              </p>
            </Link>
            <Link
              href="/admin/exceptions?preset=escalation-ready"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Escalation ready
              </p>
              <p className="mt-1 text-2xl font-semibold text-violet-100">
                {dexActionMetrics.escalationReady}
              </p>
            </Link>
          </div>
        : (
          <p className="text-sm text-slate-400">
            Action metrics did not load (forbidden, network error, or empty). Open{" "}
            <Link href="/admin/exceptions" className="text-slate-200 underline">
              the queue
            </Link>{" "}
            after hitting dispatch exceptions once so actions can bootstrap.
          </p>
        )}
      </DashboardCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminLaunchReadinessCard />
        <AdminBookingRevenueReadinessCard />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminOpsAnomaliesPanel />
        <Suspense
          fallback={
            <p className="text-sm text-white/60">Loading anomalies queue…</p>
          }
        >
          <AdminAnomaliesQueue />
        </Suspense>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardCard eyebrow="Dispatch" title="Recent dispatch exceptions">
          <div className="mb-3 flex justify-end">
            <Link
              href="/admin/exceptions"
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              View all
            </Link>
          </div>
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
                <div
                  key={`${item.bookingId}-${item.createdAt}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        Booking{" "}
                        <Link
                          href={`/admin/bookings/${encodeURIComponent(item.bookingId)}`}
                          className="font-mono text-sky-300 underline-offset-2 hover:underline"
                        >
                          {item.bookingId}
                        </Link>
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {item.status}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {formatReasons(item.reasons)}
                      </p>
                      <Link
                        href={`/admin/exceptions/actions/${encodeURIComponent(buildDispatchExceptionKeyFromBookingId(item.bookingId))}`}
                        className="mt-2 inline-flex text-xs font-medium text-slate-300 underline-offset-2 hover:text-white hover:underline"
                      >
                        Open exception action
                      </Link>
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
              No recent dispatch exceptions.
            </div>
          )}
        </DashboardCard>

        <DashboardCard eyebrow="Operations" title="Recent admin activity">
          <div className="mb-3 flex justify-end">
            <Link
              href="/admin/activity"
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              View all
            </Link>
          </div>
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
                        Booking:{" "}
                        {item.bookingId ? (
                          <Link
                            href={`/admin/bookings/${encodeURIComponent(item.bookingId)}`}
                            className="font-mono text-sky-300 underline-offset-2 hover:underline"
                          >
                            {item.bookingId}
                          </Link>
                        ) : (
                          "—"
                        )}
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

      <DashboardCard eyebrow="Dispatch" title="Recent dispatch bookings">
        <div className="mb-3 flex justify-end">
          <Link
            href="/admin/exceptions"
            className="text-sm font-medium text-slate-300 hover:text-white"
          >
            Exceptions queue
          </Link>
        </div>
        {paymentBookingsLoading ? (
          <div className="text-sm text-slate-400">Loading bookings…</div>
        ) : bookingsError ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            {bookingsError}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
            No dispatch bookings returned.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 8).map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
              >
                <div>
                  <p className="font-medium text-slate-100">{booking.id}</p>
                  <p className="text-sm text-slate-400">
                    {booking.foId ? (
                      <>
                        FO {String(booking.foId).slice(0, 10)}
                        {String(booking.foId).length > 10 ? "…" : ""}
                      </>
                    ) : (
                      <span className="font-medium text-amber-200/90">
                        Unassigned
                      </span>
                    )}
                    {" · "}
                    {booking.customerId.slice(0, 8)}… ·{" "}
                    {displayBookingPrice(booking)}
                  </p>
                  {!booking.foId ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Open booking detail for ranked assignees and one-click assign.
                    </p>
                  ) : null}
                </div>
                <BookingStatusBadge status={booking.status} />
              </Link>
            ))}
          </div>
        )}
      </DashboardCard>

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
            href="/admin/dispatch-config"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Dispatch config</p>
            <p className="mt-1 text-sm text-slate-400">
              Active/draft dispatch tuning, compare, and publish workflow.
            </p>
          </Link>

          <Link
            href="#ops-backlog"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Dispatch backlog</p>
            <p className="mt-1 text-sm text-slate-400">
              Deferred dispatch, locks, review-required backlog, and pressure metrics.
            </p>
          </Link>

          <Link
            href="/admin/knowledge-review"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Knowledge review</p>
            <p className="mt-1 text-sm text-slate-400">
              Review scenarios, SOPs, and timing signals for knowledge quality.
            </p>
          </Link>

          <Link
            href="/admin/knowledge-ops"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Knowledge ops</p>
            <p className="mt-1 text-sm text-slate-400">
              Operational knowledge pipelines and maintenance.
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
              impact. Use this surface for estimator health context (there is no separate monitoring route yet).
            </p>
          </Link>

          <Link
            href="/admin/ops/recurring"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <p className="text-sm font-semibold text-slate-100">Recurring ops</p>
            <p className="mt-1 text-sm text-slate-400">
              Generation backlog, retry exhaustion, and reconciliation drift.
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
