"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStoredAccessToken } from "@/lib/auth";
import { WEB_ENV } from "@/lib/env";
import type { AdminBookingCommandCenterPayload } from "@/lib/api/adminBookingCommandCenter";
import { useAdminBookingCommandCenterMutations } from "@/hooks/admin/useAdminBookingCommandCenterMutations";
import { AdminBookingOperationalDetailCard } from "@/components/admin/AdminBookingOperationalDetailCard";
import { AdminBookingAuthorityActionSurface } from "@/components/admin/AdminBookingAuthorityActionSurface";
import { AdminDeepCleanBookingSection } from "@/components/booking-detail/admin/AdminDeepCleanBookingSection";
import { AdminBookingLifecyclePanel } from "@/components/booking/AdminBookingLifecyclePanel";
import { dispatchAdminActivityRefresh } from "@/lib/adminActivityRefresh";
import type {
  AdminPaymentAnomalyRow,
  AssignmentRecommendation,
  BookingEvent,
  BookingPaymentStatus,
  BookingRecord,
} from "@/lib/bookings/bookingApiTypes";
import {
  assignBooking,
  assignRecommendedBooking,
  createBookingCheckout,
  fetchAssignmentRecommendations,
  listAdminPaymentAnomalies,
  updateBookingPaymentStatus,
} from "@/lib/bookings/bookingStore";

const API_BASE_URL = WEB_ENV.apiBaseUrl;

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

type BookingScreenEnvelope = {
  kind?: string;
  screen?: unknown;
};

type Loadable<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

type JsonRecord = Record<string, unknown>;

type SnapshotVisibility = {
  exists: boolean;
  inputFacts: unknown;
  outputJson: unknown;
  outputJsonText: string;
  estimatedPrice: string;
  estimatedDurationMinutes: string;
  confidenceScore: string;
  conditionScore: string;
  service: string;
  address: string;
  actualMinutes: number | null;
  learningReady: boolean;
  warnings: string[];
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

function deriveAdminPaymentSourceLine(
  events: BookingEvent[] | undefined,
  paymentStatus: BookingPaymentStatus | undefined,
): string {
  const pending =
    paymentStatus === "unpaid" ||
    paymentStatus === "checkout_created" ||
    paymentStatus === "payment_pending";

  if (!events?.length) {
    return pending
      ? "Payment source: Pending / unresolved"
      : "Payment source: Pending / unresolved";
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const paymentish = sorted.filter(
    (e) =>
      e.type === "PAYMENT_STATUS_CHANGED" ||
      e.type === "PAYMENT_ADMIN_OVERRIDE" ||
      e.type === "PAYMENT_CHECKOUT_CREATED",
  );

  for (const ev of paymentish) {
    if (ev.type === "PAYMENT_ADMIN_OVERRIDE") {
      return "Payment source: Admin override";
    }
    if (ev.type === "PAYMENT_STATUS_CHANGED") {
      const p = ev.payload as Record<string, unknown> | null | undefined;
      if (p?.source === "stripe_webhook") {
        return "Payment source: Stripe webhook";
      }
      if (String(ev.actorRole ?? "").toLowerCase() === "admin") {
        return "Payment source: Admin override";
      }
    }
  }

  if (pending) {
    return "Payment source: Pending / unresolved";
  }
  return "Payment source: Pending / unresolved";
}

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

function formatNullable(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }
  return String(value);
}

function formatMoneyFromCents(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "NULL";
  }
  return `$${(value / 100).toFixed(2)}`;
}

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as JsonRecord;
}

function parseJsonText(value: string | null | undefined): unknown {
  if (!value?.trim()) {
    return null;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return { parseError: "INVALID_JSON", raw: value };
  }
}

function numberFrom(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nestedRecord(root: JsonRecord | null, key: string): JsonRecord | null {
  return root ? asRecord(root[key]) : null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const n = numberFrom(value);
    if (n != null) return n;
  }
  return null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

function deriveActualMinutes(events: BookingEvent[] | undefined): number | null {
  if (!events?.length) return null;
  const learningEvents = events
    .filter((event) => event.payload?.kind === "estimate_learning_result")
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  return numberFrom(learningEvents[0]?.payload?.actualMinutes);
}

function formatAddressFromFacts(facts: JsonRecord | null): string {
  const serviceLocation = nestedRecord(facts, "serviceLocation");
  const parts = [
    firstString(serviceLocation?.street, facts?.street, facts?.address),
    firstString(serviceLocation?.city, facts?.city),
    firstString(serviceLocation?.state, facts?.state),
    firstString(serviceLocation?.zip, facts?.zip, facts?.postalCode),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "NULL";
}

function buildSnapshotVisibility(booking: BookingRecord | null): SnapshotVisibility {
  const snapshot = booking?.estimateSnapshot ?? null;
  const inputFacts = parseJsonText(snapshot?.inputJson);
  const outputJson = parseJsonText(snapshot?.outputJson);
  const output = asRecord(outputJson);
  const estimateV2 = nestedRecord(output, "estimateV2");
  const pricingFactors = nestedRecord(estimateV2, "pricingFactors");
  const legacy = nestedRecord(output, "legacy");
  const inputRecord = asRecord(inputFacts);
  const rawNormalizedIntake = nestedRecord(output, "rawNormalizedIntake");
  const facts = rawNormalizedIntake ?? inputRecord;
  const actualMinutes = deriveActualMinutes(booking?.events);
  const estimatedPriceCents = firstNumber(
    output?.estimatedPriceCents,
    legacy?.priceCents,
    estimateV2?.customerVisible && asRecord(estimateV2.customerVisible)?.estimatedPrice,
  );
  const estimatedDurationMinutes = firstNumber(
    output?.estimatedDurationMinutes,
    output?.estimateMinutes,
    legacy?.durationMinutes,
    estimateV2?.expectedMinutes,
  );
  const confidenceScore = firstNumber(
    output?.confidence,
    snapshot?.confidence,
    estimateV2?.confidenceScore,
  );
  const warnings: string[] = [];

  if (!snapshot) warnings.push("missing snapshot");
  if (snapshot && !snapshot.outputJson) warnings.push("missing outputJson");
  if (estimatedDurationMinutes == null) warnings.push("missing estimated duration");
  if (booking?.status === "completed" && actualMinutes == null) {
    warnings.push("completed booking without actualMinutes");
  }

  return {
    exists: Boolean(snapshot),
    inputFacts,
    outputJson,
    outputJsonText:
      outputJson == null ? "NULL" : JSON.stringify(outputJson, null, 2),
    estimatedPrice:
      estimatedPriceCents == null ? "NULL" : formatMoneyFromCents(estimatedPriceCents),
    estimatedDurationMinutes:
      estimatedDurationMinutes == null ? "NULL" : String(estimatedDurationMinutes),
    confidenceScore:
      confidenceScore == null ? "NULL" : String(confidenceScore),
    conditionScore: formatNullable(pricingFactors?.conditionScore),
    service: formatNullable(
      firstString(facts?.service_type, facts?.serviceId, facts?.service),
    ),
    address: formatAddressFromFacts(facts),
    actualMinutes,
    learningReady:
      Boolean(snapshot) && booking?.status === "completed" && actualMinutes != null,
    warnings,
  };
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

  if (
    payload &&
    typeof payload === "object" &&
    "ok" in payload &&
    (payload as { ok?: unknown }).ok === true &&
    "item" in payload
  ) {
    return (payload as { item: T }).item;
  }

  return payload as T;
}

function EstimateSnapshotVisibilitySection({
  booking,
  snapshotVisibility,
}: {
  booking: Loadable<BookingRecord>;
  snapshotVisibility: SnapshotVisibility;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Estimate snapshot visibility</h2>
        <p className="mt-1 text-sm text-white/60">
          Booking-level estimator output, actuals, and learning readiness.
        </p>
      </div>

      {booking.loading ? (
        <div className="text-sm text-white/60">Loading estimate snapshot...</div>
      ) : booking.error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
          {booking.error}
        </div>
      ) : booking.data ? (
        <div className="space-y-5">
          <div
            className={
              snapshotVisibility.exists
                ? "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100"
                : "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100"
            }
          >
            SNAPSHOT EXISTS: {snapshotVisibility.exists ? "YES" : "NO"}
          </div>

          {snapshotVisibility.warnings.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {snapshotVisibility.warnings.map((warning) => (
                <div
                  key={warning}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100"
                >
                  WARNING: {warning}
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Booking id", booking.data.id],
              ["Status", booking.data.status],
              ["Customer id", booking.data.customerId],
              ["Customer email", booking.data.customer?.email],
              ["Customer phone", booking.data.customer?.phone],
              ["Service", snapshotVisibility.service],
              ["Address", snapshotVisibility.address],
              ["Created", formatDateTime(booking.data.createdAt)],
              [
                "Scheduled time",
                formatDateTime(
                  typeof booking.data.scheduledStart === "string"
                    ? booking.data.scheduledStart
                    : null,
                ),
              ],
              [
                "FO assignment",
                booking.data.fo?.displayName || booking.data.foId || null,
              ],
              ["Estimated price", snapshotVisibility.estimatedPrice],
              [
                "Estimated duration minutes",
                snapshotVisibility.estimatedDurationMinutes,
              ],
              ["Confidence score", snapshotVisibility.confidenceScore],
              ["Condition score", snapshotVisibility.conditionScore],
              [
                "Completed at",
                formatDateTime(
                  typeof booking.data.completedAt === "string"
                    ? booking.data.completedAt
                    : null,
                ),
              ],
              ["Actual minutes", snapshotVisibility.actualMinutes],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                  {label}
                </div>
                <div className="mt-2 break-words text-sm font-semibold text-white">
                  {typeof value === "string" ? value : formatNullable(value)}
                </div>
              </div>
            ))}
          </div>

          <div
            className={
              snapshotVisibility.learningReady
                ? "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100"
                : "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100"
            }
          >
            LEARNING READY: {snapshotVisibility.learningReady ? "PASS" : "FAIL"}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-white">
                Estimate factors / input facts
              </h3>
              <pre className="max-h-[420px] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/75">
                {snapshotVisibility.inputFacts == null
                  ? "NULL"
                  : JSON.stringify(snapshotVisibility.inputFacts, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-white">
                Raw outputJson
              </h3>
              <pre className="max-h-[420px] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/75">
                {snapshotVisibility.outputJsonText}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-white/60">No booking found.</div>
      )}
    </section>
  );
}

export default function AdminBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  const [assignmentRecs, setAssignmentRecs] = useState<
    Loadable<AssignmentRecommendation[]>
  >({
    loading: true,
    error: null,
    data: null,
  });
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignmentActionError, setAssignmentActionError] = useState<
    string | null
  >(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentActionError, setPaymentActionError] = useState<string | null>(
    null,
  );
  const [paymentAnomalies, setPaymentAnomalies] = useState<AdminPaymentAnomalyRow[]>([]);

  const [bookingScreen, setBookingScreen] = useState<Loadable<unknown>>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    setToken(getStoredAccessToken());
  }, []);

  const refreshBookingSnapshot = useCallback(async () => {
    const authToken = token;
    if (!authToken || !bookingId) return;
    try {
      const data = await fetchJson<BookingRecord>(
        `${API_BASE_URL}/bookings/${bookingId}?includeEvents=true`,
        authToken,
      );
      setBooking({ loading: false, error: null, data });
    } catch (error) {
      setBooking({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to refresh booking snapshot.",
        data: null,
      });
    }
  }, [token, bookingId]);

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

  const snapshotVisibility = useMemo(
    () => buildSnapshotVisibility(booking.data),
    [booking.data],
  );

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
      setBookingScreen({ loading: true, error: null, data: null });
      setAssignmentRecs({ loading: true, error: null, data: null });

      const commandCenterPromise = fetchJson<AdminBookingCommandCenterPayload>(
        `${API_BASE_URL}/admin/bookings/${bookingId}/command-center`,
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

      const screenPromise = fetchJson<BookingScreenEnvelope>(
        `${API_BASE_URL}/bookings/${bookingId}/screen`,
        authToken,
      )
        .then((payload) => {
          if (!cancelled) {
            setBookingScreen({
              loading: false,
              error: null,
              data: payload?.screen ?? null,
            });
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setBookingScreen({
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load booking screen.",
              data: null,
            });
          }
        });

      const anomaliesPromise = fetch(
        `${API_BASE_URL}/admin/payments/anomalies?bookingId=${encodeURIComponent(bookingId)}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: "no-store",
        },
      )
        .then(async (res) => {
          const body = (await res.json().catch(() => null)) as {
            ok?: boolean;
            items?: AdminPaymentAnomalyRow[];
          } | null;
          if (!cancelled && res.ok && body?.ok && Array.isArray(body.items)) {
            setPaymentAnomalies(body.items);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPaymentAnomalies([]);
          }
        });

      const bookingPromise = fetchJson<BookingRecord>(
        `${API_BASE_URL}/bookings/${bookingId}?includeEvents=true`,
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
        `${API_BASE_URL}/bookings/${bookingId}/dispatch-exception-detail`,
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
        `${API_BASE_URL}/bookings/${bookingId}/dispatch-timeline`,
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
        `${API_BASE_URL}/bookings/${bookingId}/dispatch-explainer`,
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

      const assignmentPromise = fetchAssignmentRecommendations(bookingId)
        .then((items) => {
          if (!cancelled) {
            setAssignmentRecs({ loading: false, error: null, data: items });
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setAssignmentRecs({
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load assignment recommendations.",
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
        screenPromise,
        assignmentPromise,
        anomaliesPromise,
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
      const [
        bookingData,
        exceptionData,
        timelineData,
        explainerData,
        ccData,
        screenData,
        assignmentData,
        anomaliesReload,
      ] = await Promise.allSettled([
        fetchJson<BookingRecord>(
          `${API_BASE_URL}/bookings/${bookingId}?includeEvents=true`,
          token,
        ),
        fetchJson<DispatchExceptionDetailResponse>(
          `${API_BASE_URL}/bookings/${bookingId}/dispatch-exception-detail`,
          token,
        ),
        fetchJson<DispatchTimelineResponse>(
          `${API_BASE_URL}/bookings/${bookingId}/dispatch-timeline`,
          token,
        ),
        fetchJson<DispatchExplainerResponse>(
          `${API_BASE_URL}/bookings/${bookingId}/dispatch-explainer`,
          token,
        ),
        fetchJson<AdminBookingCommandCenterPayload>(
          `${API_BASE_URL}/admin/bookings/${bookingId}/command-center`,
          token,
        ),
        fetchJson<BookingScreenEnvelope>(
          `${API_BASE_URL}/bookings/${bookingId}/screen`,
          token,
        ),
        fetchAssignmentRecommendations(bookingId),
        listAdminPaymentAnomalies({ bookingId }),
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
      if (screenData.status === "fulfilled") {
        setBookingScreen({
          loading: false,
          error: null,
          data: screenData.value?.screen ?? null,
        });
      }
      if (assignmentData.status === "fulfilled") {
        setAssignmentRecs({
          loading: false,
          error: null,
          data: assignmentData.value,
        });
      } else if (assignmentData.status === "rejected") {
        const reason = assignmentData.reason;
        setAssignmentRecs({
          loading: false,
          error:
            reason instanceof Error
              ? reason.message
              : "Failed to load assignment recommendations.",
          data: null,
        });
      }
      if (anomaliesReload.status === "fulfilled") {
        setPaymentAnomalies(anomaliesReload.value);
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
      const response = await fetch(`${API_BASE_URL}/admin/dispatch-decisions`, {
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
      dispatchAdminActivityRefresh();
      router.refresh();
    } catch (error) {
      setCcActionError(
        error instanceof Error ? error.message : `${label} failed.`,
      );
    }
  }

  async function runAssignTopRecommendation() {
    setAssignmentActionError(null);
    setAssignBusy(true);
    try {
      await assignRecommendedBooking(bookingId);
      await reloadReadModels();
      dispatchAdminActivityRefresh();
      router.refresh();
    } catch (error) {
      setAssignmentActionError(
        error instanceof Error ? error.message : "Assign recommended failed.",
      );
    } finally {
      setAssignBusy(false);
    }
  }

  async function runAssignCandidate(foId: string) {
    setAssignmentActionError(null);
    setAssignBusy(true);
    try {
      await assignBooking(bookingId, {
        foId,
        assignmentSource: "manual",
      });
      await reloadReadModels();
      dispatchAdminActivityRefresh();
      router.refresh();
    } catch (error) {
      setAssignmentActionError(
        error instanceof Error ? error.message : "Assign failed.",
      );
    } finally {
      setAssignBusy(false);
    }
  }

  function paymentAllowsSchedule(ps: string | undefined): boolean {
    return ps === "authorized" || ps === "paid" || ps === "waived";
  }

  async function runCreateCheckoutAdmin() {
    setPaymentActionError(null);
    setPaymentBusy(true);
    try {
      await createBookingCheckout(bookingId, { actorRole: "admin" });
      await reloadReadModels();
      dispatchAdminActivityRefresh();
      router.refresh();
    } catch (error) {
      setPaymentActionError(
        error instanceof Error ? error.message : "Checkout failed.",
      );
    } finally {
      setPaymentBusy(false);
    }
  }

  async function runPaymentStatus(nextStatus: BookingPaymentStatus) {
    setPaymentActionError(null);
    setPaymentBusy(true);
    try {
      await updateBookingPaymentStatus(bookingId, {
        nextStatus,
        actorRole: "admin",
        note: `Admin payment update: ${nextStatus}`,
      });
      await reloadReadModels();
      dispatchAdminActivityRefresh();
      router.refresh();
    } catch (error) {
      setPaymentActionError(
        error instanceof Error ? error.message : "Payment update failed.",
      );
    } finally {
      setPaymentBusy(false);
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

        <EstimateSnapshotVisibilitySection
          booking={booking}
          snapshotVisibility={snapshotVisibility}
        />

        <AdminBookingOperationalDetailCard bookingId={bookingId} />

        {bookingScreen.loading ? (
          <p className="text-sm text-white/50">Loading booking screen…</p>
        ) : (
          <AdminDeepCleanBookingSection
            screen={bookingScreen.data}
            screenError={bookingScreen.error}
          />
        )}

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
          <AdminBookingAuthorityActionSurface
            loading={commandCenter.loading && !commandCenter.data}
            error={commandCenter.data ? null : commandCenter.error}
            authority={commandCenter.data?.authority}
            apiBase={API_BASE_URL}
            token={token}
            bookingId={bookingId}
            onRecomputeComplete={() => void reloadReadModels()}
          />
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
                      typeof booking.data.scheduledStart === "string" &&
                        typeof booking.data.estimatedHours === "number" &&
                        Number.isFinite(booking.data.estimatedHours)
                        ? new Date(
                            new Date(booking.data.scheduledStart).getTime() +
                              booking.data.estimatedHours * 60 * 60 * 1000,
                          ).toISOString()
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

        <section
          role="region"
          aria-label="Assignment recommendations"
          className="rounded-[28px] border border-white/10 bg-white/5 p-6"
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Assignment recommendations</h2>
              <p className="mt-1 text-sm text-white/60">
                Deterministic v1 ranking from workload and coverage fit (no road
                mileage or ETAs). Manual assign remains available in lifecycle
                controls.
              </p>
            </div>
            {assignmentRecs.data?.[0]?.recommended ? (
              <button
                type="button"
                disabled={assignBusy}
                onClick={() => void runAssignTopRecommendation()}
                className="shrink-0 rounded-2xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                Assign top pick
              </button>
            ) : null}
          </div>

          {assignmentRecs.loading ? (
            <div className="text-sm text-white/60">Loading recommendations…</div>
          ) : assignmentRecs.error ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {assignmentRecs.error}
            </div>
          ) : assignmentRecs.data && assignmentRecs.data.length > 0 ? (
            <div className="space-y-3">
              {assignmentRecs.data.map((row) => (
                <div
                  key={row.candidate.foId}
                  className={`rounded-2xl border px-4 py-3 ${
                    row.recommended
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {row.candidate.displayName}
                        </span>
                        {row.recommended ? (
                          <span className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-100">
                            Recommended
                          </span>
                        ) : null}
                        <span className="text-xs text-white/50">
                          Score {Math.round(row.candidate.finalRecommendationScore)}{" "}
                          · coverage fit{" "}
                          {Math.round(row.candidate.serviceAreaFitScore * 100)}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/55">
                        {row.candidate.reasons
                          .slice(0, 2)
                          .map((r) => r.message)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={assignBusy}
                      onClick={() => void runAssignCandidate(row.candidate.foId)}
                      className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-white/60">
              No eligible franchise owners found for ranking.
            </div>
          )}
          {assignmentActionError ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {assignmentActionError}
            </div>
          ) : null}
        </section>

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

        {booking.data ? (
          <>
            <section
              role="region"
              aria-label="Booking payment"
              className="rounded-[28px] border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  Payment
                  {paymentAnomalies.length > 0 ? (
                    <span className="ml-2 rounded-full bg-amber-500/25 px-2 py-0.5 text-xs font-semibold text-amber-100">
                      {paymentAnomalies.length} anomaly
                      {paymentAnomalies.length === 1 ? "" : "ies"}
                    </span>
                  ) : null}
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Stripe-backed payment status (webhooks) with admin waive override. Scheduling to
                  dispatch requires authorized, paid, or waived.
                </p>
                <p className="mt-3 text-sm text-white/80">
                  {deriveAdminPaymentSourceLine(
                    booking.data.events,
                    booking.data.paymentStatus,
                  )}
                </p>
                {paymentAnomalies.length > 0 ? (
                  <div
                    className="mt-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-50"
                    role="status"
                  >
                    <div className="font-semibold text-amber-100">Latest payment anomaly</div>
                    <p className="mt-1 text-amber-50/95">{paymentAnomalies[0]?.message}</p>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Status
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {String(booking.data.paymentStatus ?? "—")}
                    {booking.data.paymentStatus === "waived" ? (
                      <span className="ml-2 text-amber-200">(admin override)</span>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Amount (cents)
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {booking.data.paymentAmountCents != null
                      ? String(booking.data.paymentAmountCents)
                      : "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-2 lg:col-span-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Reference
                  </div>
                  <div className="mt-1 break-all text-sm font-semibold text-white">
                    {booking.data.paymentReference ?? "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-2 lg:col-span-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Stripe checkout session
                  </div>
                  <div className="mt-1 break-all text-sm font-semibold text-white">
                    {booking.data.stripeCheckoutSessionId ?? "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-2 lg:col-span-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Stripe payment intent
                  </div>
                  <div className="mt-1 break-all text-sm font-semibold text-white">
                    {booking.data.stripePaymentIntentId ?? "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-2 lg:col-span-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Stripe customer
                  </div>
                  <div className="mt-1 break-all text-sm font-semibold text-white">
                    {booking.data.stripeCustomerId ?? "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-2 lg:col-span-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Last Stripe event id
                  </div>
                  <div className="mt-1 break-all text-sm font-semibold text-white">
                    {booking.data.stripeLastEventId ?? "—"}
                  </div>
                </div>
              </div>
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  paymentAllowsSchedule(booking.data.paymentStatus)
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-100"
                }`}
              >
                {paymentAllowsSchedule(booking.data.paymentStatus)
                  ? "Confirmation-ready: payment is authorized, paid, or waived."
                  : "Confirmation blocked: authorize, collect payment, or waive before scheduling to dispatch."}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={paymentBusy}
                  onClick={() => void runCreateCheckoutAdmin()}
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Create checkout
                </button>
                <button
                  type="button"
                  disabled={paymentBusy}
                  onClick={() => void runPaymentStatus("authorized")}
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Mark authorized
                </button>
                <button
                  type="button"
                  disabled={paymentBusy}
                  onClick={() => void runPaymentStatus("failed")}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 disabled:opacity-50"
                >
                  Mark failed
                </button>
                <button
                  type="button"
                  disabled={paymentBusy}
                  onClick={() => void runPaymentStatus("waived")}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-100 disabled:opacity-50"
                >
                  Waive payment (admin override)
                </button>
              </div>
              {paymentActionError ? (
                <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {paymentActionError}
                </div>
              ) : null}
            </section>

            <div className="rounded-[28px] border border-white/10 bg-slate-50 p-5 text-slate-900 shadow-sm">
              <AdminBookingLifecyclePanel
                booking={booking.data}
                onBookingUpdated={refreshBookingSnapshot}
              />
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
