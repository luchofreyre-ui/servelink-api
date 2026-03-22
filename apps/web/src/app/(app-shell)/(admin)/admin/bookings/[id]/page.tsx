"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getStoredAccessToken } from "@/lib/auth";
import type { AdminBookingCommandCenterPayload } from "@/lib/api/adminBookingCommandCenter";
import { useAdminBookingCommandCenterMutations } from "@/hooks/admin/useAdminBookingCommandCenterMutations";
import { AdminBookingOperationalDetailCard } from "@/components/admin/AdminBookingOperationalDetailCard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:3001";

type BookingRecord = {
  id: string;
  status?: string | null;
  foId?: string | null;
  customerId?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
};

type TimelineDecision = {
  trigger?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
};

type DispatchTimelineResponse = {
  decisions?: TimelineDecision[];
  [key: string]: unknown;
};

type DispatchExplainerResponse = {
  summary?: string | null;
  [key: string]: unknown;
};

type DispatchExceptionDetailResponse = {
  bookingId?: string;
  bookingStatus?: string | null;
  exceptionReasons?: string[] | null;
  latestCreatedAt?: string | null;
  dispatchPasses?: number | null;
  requiresFollowUp?: boolean | null;
  priorityBucket?: string | null;
  [key: string]: unknown;
};

type Loadable<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

function workflowStateLabel(
  state: AdminBookingCommandCenterPayload["workflowState"],
): string {
  switch (state) {
    case "held":
      return "Held";
    case "in_review":
      return "In review";
    case "approved":
      return "Approved";
    case "reassign_requested":
      return "Pending reassign / re-dispatch";
    default:
      return "Open";
  }
}

type ActionState = {
  loading: string | null;
  error: string | null;
  success: string | null;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function readApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }

    const maybeError = (payload as { error?: { message?: unknown } }).error;
    if (
      maybeError &&
      typeof maybeError === "object" &&
      typeof maybeError.message === "string" &&
      maybeError.message.trim()
    ) {
      return maybeError.message;
    }
  }

  return fallback;
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      readApiErrorMessage(payload, `Request failed with status ${response.status}`),
    );
  }

  return payload as T;
}

export default function AdminBookingDetailPage() {
  const params = useParams();
  const bookingId = String(params?.id ?? "");

  const [token, setToken] = useState<string | null>(null);

  const [booking, setBooking] = useState<Loadable<BookingRecord>>({
    loading: true,
    error: null,
    data: null,
  });

  const [exceptionDetail, setExceptionDetail] =
    useState<Loadable<DispatchExceptionDetailResponse>>({
      loading: true,
      error: null,
      data: null,
    });

  const [timeline, setTimeline] = useState<Loadable<DispatchTimelineResponse>>({
    loading: true,
    error: null,
    data: null,
  });

  const [explainer, setExplainer] =
    useState<Loadable<DispatchExplainerResponse>>({
      loading: true,
      error: null,
      data: null,
    });

  const [actionState, setActionState] = useState<ActionState>({
    loading: null,
    error: null,
    success: null,
  });

  const [operatorNote, setOperatorNote] = useState("");
  const [serverOperatorNote, setServerOperatorNote] = useState<string | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteResult, setNoteResult] = useState<string | null>(null);

  const [commandCenter, setCommandCenter] = useState<
    Loadable<AdminBookingCommandCenterPayload>
  >({
    loading: true,
    error: null,
    data: null,
  });

  const [ccActionError, setCcActionError] = useState<string | null>(null);

  useEffect(() => {
    setToken(getStoredAccessToken());
  }, []);

  const applyCommandCenterPayload = useCallback((data: AdminBookingCommandCenterPayload) => {
    setCommandCenter({ loading: false, error: null, data });
    const next = data.operatorNote ?? "";
    setOperatorNote(next);
    setServerOperatorNote(next);
  }, []);

  const mutations = useAdminBookingCommandCenterMutations(
    API_BASE_URL,
    token,
    bookingId,
    applyCommandCenterPayload,
  );

  const timelineRows = useMemo(() => {
    const decisions = Array.isArray(timeline.data?.decisions)
      ? timeline.data?.decisions
      : [];

    return decisions.map((decision, index) => ({
      key: `${decision.createdAt || "unknown"}-${decision.trigger || "event"}-${index}`,
      type: decision.trigger || "unknown",
      createdAt: decision.createdAt || null,
      metadata: decision,
    }));
  }, [timeline.data]);

  useEffect(() => {
    if (!token || !bookingId) {
      return;
    }

    const authToken: string = token;

    let cancelled = false;

    async function loadAll() {
      setBooking({ loading: true, error: null, data: null });
      setExceptionDetail({ loading: true, error: null, data: null });
      setTimeline({ loading: true, error: null, data: null });
      setExplainer({ loading: true, error: null, data: null });
      setCommandCenter((prev) => ({ ...prev, loading: true, error: null }));

      const commandCenterPromise = fetchJson<AdminBookingCommandCenterPayload>(
        `${API_BASE_URL}/api/v1/admin/bookings/${bookingId}/command-center`,
        authToken,
      )
        .then((data) => {
          if (!cancelled) {
            applyCommandCenterPayload(data);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setCommandCenter({
              loading: false,
              error:
                error instanceof Error ? error.message : "Failed to load command center.",
              data: null,
            });
          }
        });

      const bookingPromise = fetchJson<BookingRecord>(
        `${API_BASE_URL}/api/v1/bookings/${bookingId}`,
        authToken,
      )
        .then((data) => {
          if (!cancelled) {
            setBooking({ loading: false, error: null, data });
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setBooking({
              loading: false,
              error:
                error instanceof Error ? error.message : "Failed to load booking.",
              data: null,
            });
          }
        });

      const exceptionPromise = fetchJson<DispatchExceptionDetailResponse>(
        `${API_BASE_URL}/api/v1/bookings/${bookingId}/dispatch-exception-detail`,
        authToken,
      )
        .then((data) => {
          if (!cancelled) {
            setExceptionDetail({ loading: false, error: null, data });
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setExceptionDetail({
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load dispatch exception detail.",
              data: null,
            });
          }
        });

      const timelinePromise = fetchJson<DispatchTimelineResponse>(
        `${API_BASE_URL}/api/v1/bookings/${bookingId}/dispatch-timeline`,
        authToken,
      )
        .then((data) => {
          if (!cancelled) {
            setTimeline({ loading: false, error: null, data });
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setTimeline({
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load dispatch timeline.",
              data: null,
            });
          }
        });

      const explainerPromise = fetchJson<DispatchExplainerResponse>(
        `${API_BASE_URL}/api/v1/bookings/${bookingId}/dispatch-explainer`,
        authToken,
      )
        .then((data) => {
          if (!cancelled) {
            setExplainer({ loading: false, error: null, data });
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setExplainer({
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load dispatch explainer.",
              data: null,
            });
          }
        });

      await Promise.allSettled([
        bookingPromise,
        exceptionPromise,
        timelinePromise,
        explainerPromise,
        commandCenterPromise,
      ]);
    }

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, [token, bookingId, applyCommandCenterPayload]);

  async function reloadReadModels() {
    if (!token || !bookingId) {
      return;
    }

    try {
      const [bookingData, exceptionData, timelineData, explainerData, ccData] =
        await Promise.allSettled([
          fetchJson<BookingRecord>(
            `${API_BASE_URL}/api/v1/bookings/${bookingId}`,
            token,
          ),
          fetchJson<DispatchExceptionDetailResponse>(
            `${API_BASE_URL}/api/v1/bookings/${bookingId}/dispatch-exception-detail`,
            token,
          ),
          fetchJson<DispatchTimelineResponse>(
            `${API_BASE_URL}/api/v1/bookings/${bookingId}/dispatch-timeline`,
            token,
          ),
          fetchJson<DispatchExplainerResponse>(
            `${API_BASE_URL}/api/v1/bookings/${bookingId}/dispatch-explainer`,
            token,
          ),
          fetchJson<AdminBookingCommandCenterPayload>(
            `${API_BASE_URL}/api/v1/admin/bookings/${bookingId}/command-center`,
            token,
          ),
        ]);

      if (bookingData.status === "fulfilled") {
        setBooking({ loading: false, error: null, data: bookingData.value });
      }
      if (exceptionData.status === "fulfilled") {
        setExceptionDetail({
          loading: false,
          error: null,
          data: exceptionData.value,
        });
      }
      if (timelineData.status === "fulfilled") {
        setTimeline({ loading: false, error: null, data: timelineData.value });
      }
      if (explainerData.status === "fulfilled") {
        setExplainer({ loading: false, error: null, data: explainerData.value });
      }
      if (ccData.status === "fulfilled") {
        applyCommandCenterPayload(ccData.value);
      }
    } catch {
      // no-op
    }
  }

  async function submitDecision(action: string, extraPayload?: Record<string, unknown>) {
    if (!token) {
      return;
    }

    let payload = extraPayload ?? {};

    if (action === "approve_assignment" || action === "reassign") {
      const targetFoId = window.prompt(
        "Enter franchiseOwnerId for this action:",
        "",
      )?.trim();

      if (!targetFoId) {
        setActionState({
          loading: null,
          error: `${action} cancelled. A franchiseOwnerId is required.`,
          success: null,
        });
        return;
      }

      payload = {
        ...payload,
        targetFoId,
      };
    }

    const defaultRationale =
      action === "hold"
        ? "Admin manually applied a dispatch hold for operational review."
        : action === "request_review"
          ? "Admin requested a formal review before further dispatch action."
          : action === "reassign"
            ? "Admin requested reassignment to a specific franchise owner."
            : "Admin approved assignment through booking detail controls.";

    setActionState({
      loading: action,
      error: null,
      success: null,
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/dispatch-decisions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          action,
          submittedAt: new Date().toISOString(),
          submittedByRole: "admin",
          source: "admin_booking_detail",
          rationale: defaultRationale,
          ...payload,
        }),
      });

      let responseJson: unknown = null;
      try {
        responseJson = await response.json();
      } catch {
        responseJson = null;
      }

      if (!response.ok) {
        throw new Error(
          readApiErrorMessage(responseJson, `${action} failed.`),
        );
      }

      setActionState({
        loading: null,
        error: null,
        success: `${action} completed successfully.`,
      });

      await reloadReadModels();
    } catch (error) {
      setActionState({
        loading: null,
        error: error instanceof Error ? error.message : `${action} failed.`,
        success: null,
      });
    }
  }

  const noteDirty =
    operatorNote.trim() !== (serverOperatorNote ?? "").trim();

  async function saveOperatorNote() {
    if (!token) {
      return;
    }

    const note = operatorNote.trim();
    if (!note) {
      setNoteResult("Enter a note before saving.");
      return;
    }

    setNoteSaving(true);
    setNoteResult(null);
    setCcActionError(null);

    try {
      await mutations.patchNote(note);
      setNoteResult("Operator note saved.");
      await reloadReadModels();
    } catch (error) {
      setNoteResult(
        error instanceof Error ? error.message : "Failed to save operator note.",
      );
    } finally {
      setNoteSaving(false);
    }
  }

  async function runCommandCenterMutation(
    label: string,
    fn: () => Promise<unknown>,
  ) {
    setCcActionError(null);
    try {
      await fn();
      await reloadReadModels();
    } catch (error) {
      setCcActionError(
        error instanceof Error ? error.message : `${label} failed.`,
      );
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-white/5 p-6">
          No auth token found. Sign in through /admin/auth first.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3">
          <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/70">
            Admin Booking Command Center
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Booking {bookingId}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-white/70">
            Live booking detail, dispatch controls, exception detail, timeline,
            explainer, and operator notes.
          </p>
          {commandCenter.data ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                Workflow: {workflowStateLabel(commandCenter.data.workflowState)}
              </div>
              {commandCenter.data.anomaly ? (
                <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70">
                  Anomaly ops status {commandCenter.data.anomaly.status}
                  {commandCenter.data.anomaly.reviewState
                    ? ` · Review ${commandCenter.data.anomaly.reviewState}`
                    : ""}
                  {commandCenter.data.anomaly.commandCenterHeld ? " · Held (flag)" : ""}
                  {commandCenter.data.anomaly.reassignmentRequested
                    ? " · Reassignment requested"
                    : ""}
                </div>
              ) : null}
            </div>
          ) : commandCenter.error ? (
            <p className="text-sm text-amber-200">{commandCenter.error}</p>
          ) : null}
        </div>

        <AdminBookingOperationalDetailCard bookingId={bookingId} />

        <section
          role="region"
          aria-label="Admin command center"
          className="rounded-[28px] border border-white/10 bg-white/5 p-6"
        >
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Admin command center</h2>
            <p className="mt-1 text-sm text-white/60">
              Server-driven workflow via /api/v1/admin/bookings/:id/* mutations
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() =>
                runCommandCenterMutation("Hold", () => mutations.hold())
              }
              disabled={
                Boolean(mutations.pendingAction) ||
                !commandCenter.data?.availableActions.canHold
              }
              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              Hold
            </button>
            <button
              type="button"
              onClick={() =>
                runCommandCenterMutation("Mark review", () => mutations.markReview())
              }
              disabled={
                Boolean(mutations.pendingAction) ||
                !commandCenter.data?.availableActions.canMarkInReview
              }
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50"
            >
              Mark review
            </button>
            <button
              type="button"
              onClick={() =>
                runCommandCenterMutation("Approve", () => mutations.approve())
              }
              disabled={
                Boolean(mutations.pendingAction) ||
                !commandCenter.data?.availableActions.canApprove
              }
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() =>
                runCommandCenterMutation("Reassign", () => mutations.reassign())
              }
              disabled={
                Boolean(mutations.pendingAction) ||
                !commandCenter.data?.availableActions.canReassign
              }
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              Reassign
            </button>
          </div>
          {mutations.pendingAction ? (
            <p className="mt-3 text-sm text-white/60">
              Applying {mutations.pendingAction.replace(/_/g, " ")}…
            </p>
          ) : null}
          {ccActionError ? (
            <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {ccActionError}
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 xl:col-span-2">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Booking overview</h2>
              <p className="mt-1 text-sm text-white/60">
                Live data from /api/v1/bookings/:id
              </p>
            </div>

            {booking.loading ? (
              <div className="text-sm text-white/60">Loading booking...</div>
            ) : booking.error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                {booking.error}
              </div>
            ) : booking.data ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Status
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {String(booking.data.status ?? "—")}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Franchise Owner
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {String(booking.data.foId ?? "—")}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Customer
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {String(booking.data.customerId ?? "—")}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Scheduled start
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {formatDateTime(
                      typeof booking.data.scheduledStart === "string"
                        ? booking.data.scheduledStart
                        : null,
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Scheduled end
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {formatDateTime(
                      typeof booking.data.scheduledEnd === "string"
                        ? booking.data.scheduledEnd
                        : null,
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Updated
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {formatDateTime(
                      typeof booking.data.updatedAt === "string"
                        ? booking.data.updatedAt
                        : null,
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/60">No booking found.</div>
            )}
          </section>

          <section
            role="region"
            aria-label="Legacy dispatch decisions"
            className="rounded-[28px] border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Legacy dispatch decisions</h2>
              <p className="mt-1 text-sm text-white/60">
                FO-targeted flows via /api/v1/admin/dispatch-decisions
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => submitDecision("approve_assignment")}
                disabled={Boolean(actionState.loading)}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                Approve Assignment
              </button>

              <button
                type="button"
                onClick={() => submitDecision("reassign")}
                disabled={Boolean(actionState.loading)}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                Reassign
              </button>

              <button
                type="button"
                onClick={() => submitDecision("hold")}
                disabled={Boolean(actionState.loading)}
                className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                HOLD
              </button>

              <button
                type="button"
                onClick={() => submitDecision("request_review")}
                disabled={Boolean(actionState.loading)}
                className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50"
              >
                Request Review
              </button>
            </div>

            {actionState.loading ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                Running action: {actionState.loading}
              </div>
            ) : null}

            {actionState.error ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {actionState.error}
              </div>
            ) : null}

            {actionState.success ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {actionState.success}
              </div>
            ) : null}
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Dispatch exception detail</h2>
              <p className="mt-1 text-sm text-white/60">
                Live data from /api/v1/bookings/:id/dispatch-exception-detail
              </p>
            </div>

            {exceptionDetail.loading ? (
              <div className="text-sm text-white/60">
                Loading exception detail...
              </div>
            ) : exceptionDetail.error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                {exceptionDetail.error}
              </div>
            ) : exceptionDetail.data ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Booking status
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {String(exceptionDetail.data.bookingStatus ?? "—")}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Dispatch passes
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {String(exceptionDetail.data.dispatchPasses ?? "—")}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Requires follow-up
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {String(exceptionDetail.data.requiresFollowUp ?? "—")}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Priority bucket
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {String(exceptionDetail.data.priorityBucket ?? "—")}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Exception reasons
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {Array.isArray(exceptionDetail.data.exceptionReasons) &&
                    exceptionDetail.data.exceptionReasons.length > 0
                      ? exceptionDetail.data.exceptionReasons.join(", ")
                      : "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Latest created at
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {formatDateTime(exceptionDetail.data.latestCreatedAt)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/60">
                No dispatch exception detail returned.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Dispatch explainer</h2>
              <p className="mt-1 text-sm text-white/60">
                Live data from /api/v1/bookings/:id/dispatch-explainer
              </p>
            </div>

            {explainer.loading ? (
              <div className="text-sm text-white/60">Loading explainer...</div>
            ) : explainer.error ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                {explainer.error}
              </div>
            ) : explainer.data ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                  {explainer.data.summary || "No summary available."}
                </div>
                <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-950/80 p-4 text-[11px] leading-5 text-white/65">
                  {JSON.stringify(explainer.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-sm text-white/60">No explainer returned.</div>
            )}
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Dispatch timeline</h2>
              <p className="mt-1 text-sm text-white/60">
                Live data from /api/v1/bookings/:id/dispatch-timeline
              </p>
            </div>

            {timeline.loading ? (
              <div className="text-sm text-white/60">Loading timeline...</div>
            ) : timeline.error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                {timeline.error}
              </div>
            ) : timelineRows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">
                No timeline events for this booking.
              </div>
            ) : (
              <div className="space-y-3">
                {timelineRows.map((row) => (
                  <article
                    key={row.key}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="text-sm font-semibold text-white">
                      {row.type}
                    </div>
                    <div className="mt-1 text-xs text-white/45">
                      {formatDateTime(row.createdAt)}
                    </div>
                    <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-neutral-950/80 p-3 text-[11px] leading-5 text-white/65">
                      {JSON.stringify(row.metadata, null, 2)}
                    </pre>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Operator note</h2>
              <p className="mt-1 text-sm text-white/60">
                Persisted via PATCH /api/v1/admin/bookings/:id/operator-note
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                value={operatorNote}
                onChange={(event) => setOperatorNote(event.target.value)}
                className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                placeholder="Add operator context, rationale, or follow-up notes."
              />
              <button
                type="button"
                onClick={saveOperatorNote}
                disabled={noteSaving || Boolean(mutations.pendingAction) || !noteDirty}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {noteSaving ? "Saving note..." : "Save operator note"}
              </button>

              {noteResult ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
                  {noteResult}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Command center activity</h2>
            <p className="mt-1 text-sm text-white/60">
              Recent mutations for this booking (server preview)
            </p>
          </div>
          {commandCenter.data?.activityPreview?.length ? (
            <ul className="space-y-3">
              {commandCenter.data.activityPreview.map((row) => (
                <li
                  key={row.id}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80"
                >
                  <div className="font-semibold text-white">{row.type}</div>
                  <div className="text-white/60">{row.summary}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-white/60">No command center activity yet.</div>
          )}
        </section>
      </div>
    </main>
  );
}
