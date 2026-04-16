"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  getRecurringPlan,
  skipNextRecurringOccurrence,
  updateNextRecurringOccurrence,
  updateRecurringPlan,
  type PlanReconciliation,
  type RecurringPlanDetailResponse,
  type UpdateNextOccurrencePayload,
  type UpdateRecurringPlanPayload,
} from "@/components/marketing/precision-luxury/booking/bookingRecurringApi";

const MUTABLE_NEXT_STATUSES = new Set([
  "pending_generation",
  "booking_created",
  "scheduled",
  "needs_review",
]);

function getStr(o: unknown, key: string): string {
  if (!o || typeof o !== "object") return "";
  const v = (o as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

function getGenerationError(o: unknown): string | null {
  if (!o || typeof o !== "object") return null;
  const v = (o as Record<string, unknown>).generationError;
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function userFacingGenerationSummary(err: string | null): string {
  if (!err) {
    return "We ran into an issue setting up your next recurring visit. Please contact support.";
  }
  const lower = err.toLowerCase();
  if (
    lower.includes("prisma") ||
    lower.includes("stack") ||
    lower.includes("exception") ||
    err.length > 220
  ) {
    return "We ran into an issue setting up your next recurring visit. Please contact support.";
  }
  return err;
}

function formatJsonField(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ");
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function parseAddonIdsCsv(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function defaultReconciliation(): PlanReconciliation {
  return {
    hasUpcomingBookedOccurrence: false,
    planCancellationEffect: "none",
  };
}

export function RecurringPlanDetailClient() {
  const params = useParams<{ planId: string }>();
  const planId = params?.planId ?? "";

  const [detail, setDetail] = useState<RecurringPlanDetailResponse["item"] | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const load = useCallback(() => {
    if (!planId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void getRecurringPlan(planId)
      .then((r) => {
        setDetail(r.item);
        setLoadError(null);
      })
      .catch((e: unknown) => {
        setDetail(null);
        setLoadError(e instanceof Error ? e.message : "Failed to load plan.");
      })
      .finally(() => setLoading(false));
  }, [planId]);

  useEffect(() => {
    load();
  }, [load]);

  const plan = detail?.plan ?? null;
  const nextOcc = detail?.nextOccurrence ?? null;
  const rec = detail?.reconciliation ?? defaultReconciliation();

  const planStatus = getStr(plan, "status");
  const nextStatus = getStr(nextOcc, "status");

  const canSkipNext =
    Boolean(nextOcc) && nextOcc != null && MUTABLE_NEXT_STATUSES.has(nextStatus);

  const statusBanners = useMemo(() => {
    const rows: { key: string; tone: "info" | "warn" | "ok"; text: string }[] = [];
    const genErr = getGenerationError(nextOcc);
    if (nextStatus === "needs_review" || Boolean(genErr)) {
      rows.push({
        key: "needs-review",
        tone: "warn",
        text:
          "Your next recurring visit needs review before it can be finalized. " +
          userFacingGenerationSummary(genErr),
      });
    }
    if (planStatus === "paused") {
      rows.push({
        key: "paused",
        tone: "info",
        text:
          "Your recurring plan is paused. New recurring visits will not be generated until you resume.",
      });
    }
    if (planStatus === "canceled") {
      if (
        rec.planCancellationEffect === "booking_linked_but_not_canceled" ||
        rec.hasUpcomingBookedOccurrence
      ) {
        rows.push({
          key: "canceled-booking-retained",
          tone: "warn",
          text:
            "Your recurring plan is canceled. One upcoming visit is still on the calendar and was not automatically canceled.",
        });
      } else if (rec.planCancellationEffect === "booking_canceled") {
        rows.push({
          key: "canceled-booking-cleared",
          tone: "ok",
          text:
            "Your recurring plan is canceled, and the linked upcoming booking was canceled in our system.",
        });
      } else {
        rows.push({
          key: "canceled-clean",
          tone: "info",
          text:
            "Your recurring plan is canceled. No future recurring visits will be generated.",
        });
      }
    }
    return rows;
  }, [planStatus, nextOcc, nextStatus, rec]);

  const defaultForm = useMemo(() => {
    return {
      cadence: getStr(plan, "cadence") || "weekly",
      preferredTimeWindow: getStr(plan, "preferredTimeWindow"),
      bookingNotes: getStr(plan, "bookingNotes"),
      preferredFoId: getStr(plan, "preferredFoId"),
    };
  }, [plan]);

  const [defaultsState, setDefaultsState] = useState(defaultForm);

  useEffect(() => {
    setDefaultsState(defaultForm);
  }, [defaultForm]);

  const nextFormInit = useMemo(() => {
    const snap =
      nextOcc &&
      typeof nextOcc.bookingSnapshot === "object" &&
      nextOcc.bookingSnapshot !== null &&
      !Array.isArray(nextOcc.bookingSnapshot)
        ? (nextOcc.bookingSnapshot as Record<string, unknown>)
        : null;
    const twFromSnap =
      snap && typeof snap.preferredTimeWindow === "string"
        ? snap.preferredTimeWindow
        : "";
    return {
      targetDate: getStr(nextOcc, "targetDate").slice(0, 10),
      preferredTimeWindow: twFromSnap || getStr(plan, "preferredTimeWindow"),
      overrideInstructions: getStr(nextOcc, "overrideInstructions"),
      overrideAddonIds: formatJsonField(nextOcc?.overrideAddonIds),
      preferredFoId: getStr(nextOcc, "overridePreferredFoId"),
    };
  }, [nextOcc, plan]);

  const [nextState, setNextState] = useState(nextFormInit);

  useEffect(() => {
    setNextState(nextFormInit);
  }, [nextFormInit]);

  const run = async (fn: () => Promise<void>, successMessage = "Saved.") => {
    setBusy(true);
    setFormMessage(null);
    try {
      await fn();
      setFormMessage(successMessage);
      load();
    } catch (e: unknown) {
      setFormMessage(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const onSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return;
    const payload: UpdateRecurringPlanPayload = {
      cadence: defaultsState.cadence as UpdateRecurringPlanPayload["cadence"],
      preferredTimeWindow: defaultsState.preferredTimeWindow,
      bookingNotes: defaultsState.bookingNotes,
      preferredFoId: defaultsState.preferredFoId,
    };
    void run(async () => {
      await updateRecurringPlan(planId, payload);
    });
  };

  const onSaveNextOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return;
    const payload: UpdateNextOccurrencePayload = {
      targetDate: nextState.targetDate
        ? new Date(`${nextState.targetDate}T12:00:00`).toISOString()
        : undefined,
      preferredTimeWindow: nextState.preferredTimeWindow || undefined,
      overrideInstructions: nextState.overrideInstructions || undefined,
      overrideAddonIds: parseAddonIdsCsv(nextState.overrideAddonIds),
      preferredFoId: nextState.preferredFoId || undefined,
    };
    void run(async () => {
      await updateNextRecurringOccurrence(planId, payload);
    });
  };

  const lifecyclePauseResume = (action: "pause" | "resume") => {
    if (!planId) return;
    void run(async () => {
      await updateRecurringPlan(planId, { action });
    });
  };

  const submitCancelPlan = async () => {
    if (!planId) return;
    setBusy(true);
    setFormMessage(null);
    try {
      const res = await updateRecurringPlan(planId, { action: "cancel" });
      setCancelConfirmOpen(false);
      if (res.nextOccurrenceDisposition === "booking_retained") {
        setFormMessage(
          "Plan canceled. An upcoming visit is still on the calendar; its booking was not automatically removed. Contact support if you need help.",
        );
      } else if (res.downstreamBookingEffect === "applied") {
        setFormMessage(
          "Plan canceled and the linked upcoming booking was canceled in our system.",
        );
      } else {
        setFormMessage("Plan canceled.");
      }
      load();
    } catch (e: unknown) {
      setFormMessage(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const onSkip = () => {
    if (!planId) return;
    void run(async () => {
      await skipNextRecurringOccurrence(planId);
    }, "Next visit skipped.");
  };

  if (!planId) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-slate-600">Missing plan id.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-slate-600">Loading…</p>
      </main>
    );
  }

  if (loadError || !detail || !plan) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-amber-800">{loadError ?? "Plan not found."}</p>
        <Link href="/customer/recurring" className="mt-4 inline-block text-teal-700">
          ← All recurring plans
        </Link>
      </main>
    );
  }

  const bannerToneClass = (tone: "info" | "warn" | "ok") => {
    if (tone === "warn") {
      return "border-amber-200 bg-amber-50 text-amber-950";
    }
    if (tone === "ok") {
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    }
    return "border-slate-200 bg-slate-50 text-slate-900";
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Recurring plan</h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{planId}</p>
          <p className="mt-2 text-sm text-slate-600">
            <span className="capitalize">{planStatus}</span>
            {" · "}
            <span className="capitalize">{getStr(plan, "cadence")}</span>
            {" · "}
            {getStr(plan, "serviceType")}
          </p>
        </div>
        <Link
          href="/customer/recurring"
          className="text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          ← All plans
        </Link>
      </div>

      {statusBanners.length > 0 ? (
        <div className="mt-6 space-y-3" role="region" aria-label="Plan status">
          {statusBanners.map((b) => (
            <div
              key={b.key}
              className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${bannerToneClass(b.tone)}`}
            >
              {b.text}
            </div>
          ))}
        </div>
      ) : null}

      {formMessage ? (
        <p className="mt-4 text-sm text-slate-700" role="status">
          {formMessage}
        </p>
      ) : null}

      <section className="mt-8 rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-medium text-slate-900">Plan actions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pause stops new recurring generation from this plan. Cancel ends the plan.
          Completed past visits are not changed. Canceling does not retroactively edit
          finished visits.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {planStatus === "active" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => lifecyclePauseResume("pause")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Pause plan
            </button>
          ) : null}
          {planStatus === "paused" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => lifecyclePauseResume("resume")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Resume plan
            </button>
          ) : null}
          {planStatus === "active" || planStatus === "paused" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setCancelConfirmOpen(true)}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100 disabled:opacity-50"
            >
              Cancel plan
            </button>
          ) : null}
          {canSkipNext ? (
            <button
              type="button"
              disabled={busy}
              onClick={onSkip}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
            >
              Skip next visit
            </button>
          ) : null}
        </div>
        {cancelConfirmOpen ? (
          <div className="mt-5 rounded-lg border border-red-100 bg-red-50/60 p-4 text-sm text-red-950">
            <p className="font-medium">Cancel this recurring plan?</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>This stops future recurring generation from this plan.</li>
              <li>
                If an upcoming visit is already booked, it may stay on the calendar
                unless the system can cancel it automatically.
              </li>
              <li>This does not change completed visits.</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitCancelPlan()}
                className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-50"
              >
                Yes, cancel plan
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setCancelConfirmOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                Back
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Next visit only
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          These changes affect only your next upcoming recurring visit. They do not
          rewrite the full series or past visits.
        </p>
        {!nextOcc ? (
          <p className="mt-4 text-sm text-slate-600">
            No upcoming editable visit (completed, skipped, or none scheduled).
          </p>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={onSaveNextOnly}>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Target date
              </label>
              <input
                type="date"
                className="mt-1 w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
                value={nextState.targetDate}
                onChange={(e) =>
                  setNextState((s) => ({ ...s, targetDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Preferred time window
              </label>
              <input
                type="text"
                className="mt-1 w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm"
                value={nextState.preferredTimeWindow}
                onChange={(e) =>
                  setNextState((s) => ({ ...s, preferredTimeWindow: e.target.value }))
                }
                placeholder="e.g. mornings, after 2pm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Override instructions
              </label>
              <textarea
                className="mt-1 w-full max-w-lg rounded border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                value={nextState.overrideInstructions}
                onChange={(e) =>
                  setNextState((s) => ({ ...s, overrideInstructions: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Override add-on ids (comma-separated)
              </label>
              <input
                type="text"
                className="mt-1 w-full max-w-lg rounded border border-slate-300 px-3 py-2 text-sm font-mono"
                value={nextState.overrideAddonIds}
                onChange={(e) =>
                  setNextState((s) => ({ ...s, overrideAddonIds: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Preferred FO (this visit)
              </label>
              <input
                type="text"
                className="mt-1 w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm"
                value={nextState.preferredFoId}
                onChange={(e) =>
                  setNextState((s) => ({ ...s, preferredFoId: e.target.value }))
                }
              />
            </div>
            <button
              type="submit"
              disabled={busy || planStatus === "canceled"}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              Save next visit only
            </button>
          </form>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Plan defaults going forward
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          These settings affect future recurring generation and do not retroactively
          rewrite past visits.
        </p>
        <form className="mt-4 space-y-4" onSubmit={onSaveDefaults}>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Cadence
            </label>
            <select
              className="mt-1 w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm capitalize"
              value={defaultsState.cadence}
              onChange={(e) =>
                setDefaultsState((s) => ({ ...s, cadence: e.target.value }))
              }
              disabled={planStatus === "canceled"}
            >
              <option value="weekly">weekly</option>
              <option value="biweekly">biweekly</option>
              <option value="monthly">monthly</option>
            </select>
            <p className="mt-2 max-w-prose text-xs leading-relaxed text-slate-600">
              Cadence changes apply going forward and do not rewrite completed or
              previously processed visits. The system does not bulk-regenerate past
              occurrence rows when cadence changes.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Preferred time window
            </label>
            <input
              type="text"
              className="mt-1 w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm"
              value={defaultsState.preferredTimeWindow}
              onChange={(e) =>
                setDefaultsState((s) => ({
                  ...s,
                  preferredTimeWindow: e.target.value,
                }))
              }
              disabled={planStatus === "canceled"}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Booking notes
            </label>
            <textarea
              className="mt-1 w-full max-w-lg rounded border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              value={defaultsState.bookingNotes}
              onChange={(e) =>
                setDefaultsState((s) => ({ ...s, bookingNotes: e.target.value }))
              }
              disabled={planStatus === "canceled"}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Preferred FO (plan default)
            </label>
            <input
              type="text"
              className="mt-1 w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm"
              value={defaultsState.preferredFoId}
              onChange={(e) =>
                setDefaultsState((s) => ({ ...s, preferredFoId: e.target.value }))
              }
              disabled={planStatus === "canceled"}
            />
          </div>
          <button
            type="submit"
            disabled={busy || planStatus === "canceled"}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Save plan defaults
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-medium text-slate-900">Recent visits</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {detail.recentOccurrences.map((o) => (
            <li
              key={getStr(o, "id")}
              className="flex flex-wrap justify-between gap-2 rounded border border-slate-100 bg-slate-50/80 px-3 py-2"
            >
              <span className="font-mono text-xs">{getStr(o, "id").slice(0, 12)}…</span>
              <span className="capitalize">{getStr(o, "status")}</span>
              <span className="text-slate-600">
                {getStr(o, "targetDate")
                  ? new Date(getStr(o, "targetDate")).toLocaleDateString()
                  : "—"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
