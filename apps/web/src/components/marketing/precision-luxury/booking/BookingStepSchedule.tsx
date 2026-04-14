"use client";

import { BookingOptionCard } from "../BookingOptionCard";
import { BookingSectionCard } from "../BookingSectionCard";
import { BookingStepCleanerPreference } from "./BookingStepCleanerPreference";
import type {
  BookingFlowState,
  BookingFrequencyOption,
  BookingTimeOption,
  CleanerPreference,
  ScheduleSelection,
} from "./bookingFlowTypes";

const frequencyOptions: BookingFrequencyOption[] = [
  "Weekly",
  "Bi-Weekly",
  "Monthly",
  "One-Time",
];

const timeOptions: BookingTimeOption[] = [
  "Weekday Morning",
  "Weekday Afternoon",
  "Friday",
  "Saturday",
];

const dayWindowOptions = [
  { value: "", label: "No specific day preference" },
  { value: "weekdays", label: "Weekdays (Mon–Fri)" },
  { value: "weekends", label: "Weekends" },
  { value: "flexible", label: "Flexible — dispatch may suggest" },
] as const;

type BookingStepScheduleProps = {
  state: BookingFlowState;
  onFrequencySelect: (value: BookingFrequencyOption) => void;
  onTimeSelect: (value: BookingTimeOption) => void;
  onScheduleSelectionPatch: (patch: Partial<ScheduleSelection>) => void;
  onCleanerPreferenceChange: (next: CleanerPreference) => void;
};

export function BookingStepSchedule({
  state,
  onFrequencySelect,
  onTimeSelect,
  onScheduleSelectionPatch,
  onCleanerPreferenceChange,
}: BookingStepScheduleProps) {
  const sel = state.scheduleSelection;
  const dayWindow = sel?.preferredDayWindow ?? "";
  const flexNotes = sel?.flexibilityNotes ?? "";

  return (
    <BookingSectionCard
      eyebrow="Step 4"
      title="Choose your schedule"
      body="Select cadence and timing. Exact slot booking will appear here once availability is wired to this funnel; today we capture honest preferences only."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-2 font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Preferred frequency
          </p>

          {!state.frequency && (
            <p className="mb-4 text-sm text-[#64748B]">
              Choose how often you want service.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            {frequencyOptions.map((option) => (
              <div key={option} onClick={() => onFrequencySelect(option)}>
                <BookingOptionCard
                  title={option}
                  body="Select the cadence that fits your lifestyle."
                  selected={state.frequency === option}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Preferred timing
          </p>

          {!state.preferredTime && (
            <p className="mb-4 text-sm text-[#64748B]">
              Choose a time window that works best for your routine.
            </p>
          )}

          <div className="grid gap-4">
            {timeOptions.map((option) => (
              <div key={option} onClick={() => onTimeSelect(option)}>
                <BookingOptionCard
                  title={option}
                  body="We’ll match you with availability in this window."
                  selected={state.preferredTime === option}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-4 border-t border-[#C9B27C]/14 pt-8">
        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
          Visit timing preferences
        </p>
        <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
          Day-level preferences help dispatch propose visits. This is not a confirmed calendar slot.
        </p>
        <label
          className="block font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]"
          htmlFor="schedule-day-window"
        >
          Preferred day focus
        </label>
        <select
          id="schedule-day-window"
          className="w-full max-w-md rounded-xl border border-[#C9B27C]/25 bg-white px-3 py-2 font-[var(--font-manrope)] text-sm text-[#0F172A] outline-none ring-1 ring-[#C9B27C]/10 focus:border-[#0D9488]/40"
          value={dayWindow}
          onChange={(e) =>
            onScheduleSelectionPatch({
              preferredDayWindow: e.target.value || null,
            })
          }
        >
          {dayWindowOptions.map((o) => (
            <option key={o.value || "none"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label
          className="block font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]"
          htmlFor="schedule-flex-notes"
        >
          Timing flexibility / notes for dispatch
        </label>
        <textarea
          id="schedule-flex-notes"
          className="min-h-[88px] w-full max-w-2xl rounded-xl border border-[#C9B27C]/25 bg-white px-3 py-2 font-[var(--font-manrope)] text-sm text-[#0F172A] outline-none ring-1 ring-[#C9B27C]/10 focus:border-[#0D9488]/40"
          placeholder="Example: “After 10am only” or “Dog walker arrives at noon.”"
          value={flexNotes}
          onChange={(e) =>
            onScheduleSelectionPatch({
              flexibilityNotes: e.target.value || null,
            })
          }
        />
      </div>

      <div className="mt-10">
        <BookingStepCleanerPreference
          value={state.cleanerPreference}
          onChange={onCleanerPreferenceChange}
        />
      </div>
    </BookingSectionCard>
  );
}
