"use client";

import type { RecurringCadence } from "./bookingFlowTypes";

type Props = {
  onOneTime: () => void;
  onRecurring: (cadence: RecurringCadence) => void;
};

export default function BookingStepDecision({
  onOneTime,
  onRecurring,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
          Choose how you want to proceed
        </h2>
        <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
          Book this estimate as a one-time cleaning or turn it into a recurring maintenance plan.
        </p>
      </div>

      <div className="grid gap-4">
        <button
          type="button"
          onClick={onOneTime}
          className="rounded-2xl border border-[#C9B27C]/16 bg-white p-5 text-left ring-1 ring-[#C9B27C]/10 transition hover:border-[#C9B27C]/40"
        >
          <div className="font-[var(--font-manrope)] text-base font-medium text-[#0F172A]">
            One-time cleaning
          </div>
          <div className="mt-1 font-[var(--font-manrope)] text-sm text-[#64748B]">
            Continue with this estimate as a single booking.
          </div>
        </button>

        <div className="space-y-4 rounded-2xl border border-[#C9B27C]/16 bg-white p-5 ring-1 ring-[#C9B27C]/10">
          <div>
            <div className="font-[var(--font-manrope)] text-base font-medium text-[#0F172A]">
              Maintain this home
            </div>
            <div className="mt-1 font-[var(--font-manrope)] text-sm text-[#64748B]">
              Select a recurring cleaning cadence.
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => onRecurring("weekly")}
              className="rounded-xl border border-[#C9B27C]/20 px-4 py-3 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A] transition hover:border-[#C9B27C]/45"
            >
              Weekly
            </button>

            <button
              type="button"
              onClick={() => onRecurring("biweekly")}
              className="rounded-xl border border-[#C9B27C]/20 px-4 py-3 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A] transition hover:border-[#C9B27C]/45"
            >
              Bi-weekly
            </button>

            <button
              type="button"
              onClick={() => onRecurring("monthly")}
              className="rounded-xl border border-[#C9B27C]/20 px-4 py-3 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A] transition hover:border-[#C9B27C]/45"
            >
              Monthly
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
