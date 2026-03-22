"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AdminDispatchDecisionAction,
  AdminDispatchDecisionInput,
} from "@/contracts/adminDispatchDecision";
import type { AdminBookingDispatchCandidate } from "@/operations/adminBookingDispatch/adminBookingDispatchDetailModel";

interface Props {
  bookingId: string;
  candidates: AdminBookingDispatchCandidate[];
  defaultAction: AdminDispatchDecisionAction;
  defaultActionReason: string;
  source?: AdminDispatchDecisionInput["source"];
  isSubmitting?: boolean;
  submissionError?: string;
  submissionSuccess?: string;
  submissionUnavailable?: string;
  onSubmit?: (input: {
    bookingId: string;
    action: AdminDispatchDecisionAction;
    rationale: string;
    targetFoId?: string;
  }) => void | Promise<void>;
}

const ACTION_COPY: Record<
  AdminDispatchDecisionAction,
  { label: string; tone: string; help: string }
> = {
  approve_assignment: {
    label: "Approve Assignment",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
    help: "Confirm the current recommended path and close the decision loop.",
  },
  reassign: {
    label: "Reassign",
    tone: "border-blue-200 bg-blue-50 text-blue-900",
    help: "Move the booking to a different operator path because the current one is weak.",
  },
  hold: {
    label: "Hold",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
    help: "Pause the booking long enough to reduce risk before making a dispatch commitment.",
  },
  escalate: {
    label: "Escalate",
    tone: "border-rose-200 bg-rose-50 text-rose-900",
    help: "Push the booking into tighter control because routine dispatch logic is not sufficient.",
  },
  request_review: {
    label: "Request Review",
    tone: "border-violet-200 bg-violet-50 text-violet-900",
    help: "Require proof, reliability, or standards review before confirming the path.",
  },
};

export default function AdminBookingDispatchActionBar({
  bookingId,
  candidates,
  defaultAction,
  defaultActionReason,
  source = "admin_booking_detail",
  isSubmitting = false,
  submissionError,
  submissionSuccess,
  submissionUnavailable,
  onSubmit,
}: Props) {
  const [action, setAction] = useState<AdminDispatchDecisionAction>(defaultAction);
  const [targetFoId, setTargetFoId] = useState<string>(candidates[0]?.foId ?? "");
  const [rationale, setRationale] = useState<string>(defaultActionReason);

  useEffect(() => {
    setAction(defaultAction);
    setRationale(defaultActionReason);
    setTargetFoId(candidates[0]?.foId ?? "");
  }, [defaultAction, defaultActionReason, candidates]);

  const selectedActionCopy = useMemo(() => ACTION_COPY[action], [action]);

  const requiresTarget = action === "approve_assignment" || action === "reassign";

  const rationaleQuality =
    rationale.trim().length >= 30
      ? "Sufficient"
      : rationale.trim().length > 0
        ? "Too short — add more context"
        : "Missing";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Decision Console
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Operator action with rationale capture
          </h2>
        </div>

        <div className={`rounded-2xl border px-4 py-3 text-sm ${selectedActionCopy.tone}`}>
          <p className="font-semibold">{selectedActionCopy.label}</p>
          <p className="mt-1">{selectedActionCopy.help}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Action
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(Object.keys(ACTION_COPY) as AdminDispatchDecisionAction[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAction(key)}
                  disabled={isSubmitting}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    action === key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  } ${isSubmitting ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <p className="font-semibold">{ACTION_COPY[key].label}</p>
                  <p className="mt-1 text-xs opacity-80">{ACTION_COPY[key].help}</p>
                </button>
              ))}
            </div>
          </div>

          {requiresTarget ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Target FO
              </label>
              <select
                value={targetFoId}
                onChange={(event) => setTargetFoId(event.target.value)}
                disabled={isSubmitting}
                className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {candidates.length === 0 ? (
                  <option value="">No candidates available</option>
                ) : (
                  candidates.map((candidate) => (
                    <option key={candidate.foId} value={candidate.foId}>
                      {candidate.label} · Rank #{candidate.rank} · Score {Math.round(candidate.score)}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Rationale
            </label>
            <textarea
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              rows={6}
              disabled={isSubmitting}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Capture why this decision is the right control path for this booking."
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Ready-to-submit decision
          </p>

          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Booking</p>
              <p className="mt-1 font-medium text-slate-900">{bookingId}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Action</p>
              <p className="mt-1 font-medium text-slate-900">{ACTION_COPY[action].label}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Source</p>
              <p className="mt-1 font-medium text-slate-900">{source}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Target FO</p>
              <p className="mt-1 font-medium text-slate-900">
                {requiresTarget ? targetFoId || "Not selected" : "Not required"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rationale quality</p>
              <p className="mt-1 font-medium text-slate-900">{rationaleQuality}</p>
            </div>
          </div>

          {submissionError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {submissionError}
            </div>
          ) : null}

          {submissionUnavailable ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {submissionUnavailable}
            </div>
          ) : null}

          {submissionSuccess ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {submissionSuccess}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={isSubmitting || rationale.trim().length < 20}
              onClick={() =>
                onSubmit?.({
                  bookingId,
                  action,
                  targetFoId: requiresTarget ? targetFoId || undefined : undefined,
                  rationale: rationale.trim(),
                })
              }
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Decision"}
            </button>

            <p className="text-xs leading-5 text-slate-500">
              This mutation layer submits a real typed payload and distinguishes accepted, unavailable,
              and rejected outcomes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
