"use client";

import { buildBookingDispatchHandoffSummary } from "@/lib/booking/bookingDispatchHandoff";
import { BookingSectionCard } from "../BookingSectionCard";
import type { BookingFlowState } from "./bookingFlowTypes";

type Props = {
  state: BookingFlowState;
};

function recurringLabel(state: BookingFlowState) {
  const intent = state.recurringIntent;
  if (!intent) return "Not selected";
  if (intent.type === "one_time") return "One-time cleaning";
  const cadence =
    intent.cadence === "weekly"
      ? "Weekly"
      : intent.cadence === "biweekly"
        ? "Bi-weekly"
        : "Monthly";
  return `Recurring · ${cadence}`;
}

function firstVisitSummary(state: BookingFlowState) {
  if (state.recurringIntent?.type !== "recurring" || !state.recurringSetup) {
    return null;
  }
  const d = state.recurringSetup.nextAnchorDate;
  const twLabels: Record<string, string> = {
    morning: "Morning",
    midday: "Midday",
    afternoon: "Afternoon",
    anytime: "Any time",
  };
  const tw =
    twLabels[state.recurringSetup.timePreference] ??
    state.recurringSetup.timePreference;
  return d ? `${d} · ${tw}` : null;
}

export function BookingStepConfirm({ state }: Props) {
  const visitLine = firstVisitSummary(state);
  const snap = state.estimateSnapshot;
  const priceLine =
    snap != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(snap.priceCents / 100)
      : null;

  const handoff = buildBookingDispatchHandoffSummary(state);

  return (
    <BookingSectionCard
      eyebrow="Step 8"
      title="Confirm and send"
      body="Your estimate is locked from the review step. Confirm your plan choice, then submit your booking direction. We’ll use your timing preferences to finalize scheduling (preference-based today — not a guaranteed exact slot until availability is wired end-to-end). If you requested a preferred cleaner, we’ll prioritize that team when available; assignment still follows capacity and ops review when needed."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4 ring-1 ring-[#C9B27C]/10">
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Service
          </p>
          <p className="mt-1 font-[var(--font-manrope)] text-base font-medium text-[#0F172A]">
            {handoff.serviceLabel}
          </p>
        </div>

        <div className="rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4 ring-1 ring-[#C9B27C]/10">
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Home
          </p>
          <p className="mt-1 font-[var(--font-manrope)] text-sm text-[#0F172A]">
            {handoff.homeSummary}
          </p>
        </div>

        <div className="rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4 ring-1 ring-[#C9B27C]/10">
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Estimate
          </p>
          <p className="mt-1 font-[var(--font-manrope)] text-sm text-[#0F172A]">
            {handoff.estimateSummary ?? "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4 ring-1 ring-[#C9B27C]/10">
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Schedule
          </p>
          <p className="mt-1 font-[var(--font-manrope)] text-sm text-[#0F172A]">
            {handoff.scheduleSummary}
          </p>
        </div>

        <div className="rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4 ring-1 ring-[#C9B27C]/10">
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Cleaner preference
          </p>
          <p className="mt-1 font-[var(--font-manrope)] text-sm text-[#0F172A]">
            {handoff.cleanerSummary}
          </p>
        </div>

        <div className="rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4 ring-1 ring-[#C9B27C]/10">
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Plan
          </p>
          <p className="mt-2 font-[var(--font-manrope)] text-base font-medium text-[#0F172A]">
            {recurringLabel(state)}
          </p>
          {visitLine ? (
            <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#64748B]">
              First visit: {visitLine}
            </p>
          ) : state.recurringIntent?.type === "recurring" ? (
            <p className="mt-2 font-[var(--font-manrope)] text-sm font-medium text-[#B45309]">
              Please complete your recurring setup before continuing.
            </p>
          ) : null}
          {priceLine && snap ? (
            <p className="mt-3 font-[var(--font-manrope)] text-sm text-[#64748B]">
              Locked review estimate:{" "}
              <span className="font-medium text-[#0F172A] tabular-nums">{priceLine}</span>{" "}
              ({snap.durationMinutes} min, confidence {Math.round(snap.confidence * 100)}%)
            </p>
          ) : null}
        </div>
      </div>
    </BookingSectionCard>
  );
}
