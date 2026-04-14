"use client";

import { useEffect, useMemo, useState } from "react";
import { BookingOptionCard } from "../BookingOptionCard";
import { BookingSectionCard } from "../BookingSectionCard";
import { BookingStepCleanerPreference } from "./BookingStepCleanerPreference";
import {
  getBookingAvailabilityWindows,
  type BookingAvailabilityWindow,
} from "./bookingAvailabilityApi";
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

const DEFAULT_SLOT_DURATION_MINUTES = 180;

function isUuidLike(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function slotRangeIso(): { rangeStart: string; rangeEnd: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
}

function formatWindowLabel(w: BookingAvailabilityWindow): string {
  try {
    const a = new Date(w.startAt);
    const b = new Date(w.endAt);
    if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime())) {
      return `${w.startAt} → ${w.endAt}`;
    }
    return `${a.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })} – ${b.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  } catch {
    return `${w.startAt} → ${w.endAt}`;
  }
}

function dateOnlyFromIso(iso: string): string | null {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

type BookingStepScheduleProps = {
  state: BookingFlowState;
  slotApisEnabled: boolean;
  slotDurationMinutes: number;
  onFrequencySelect: (value: BookingFrequencyOption) => void;
  onTimeSelect: (value: BookingTimeOption) => void;
  onScheduleSelectionPatch: (patch: Partial<ScheduleSelection>) => void;
  onCleanerPreferenceChange: (next: CleanerPreference) => void;
};

export function BookingStepSchedule({
  state,
  slotApisEnabled,
  slotDurationMinutes,
  onFrequencySelect,
  onTimeSelect,
  onScheduleSelectionPatch,
  onCleanerPreferenceChange,
}: BookingStepScheduleProps) {
  const sel = state.scheduleSelection;
  const dayWindow = sel?.preferredDayWindow ?? "";
  const flexNotes = sel?.flexibilityNotes ?? "";

  const foId = state.cleanerPreference?.cleanerId?.trim() ?? "";
  const duration = Math.max(
    1,
    Math.floor(slotDurationMinutes || DEFAULT_SLOT_DURATION_MINUTES),
  );

  const [windows, setWindows] = useState<BookingAvailabilityWindow[] | null>(
    null,
  );
  const [windowsError, setWindowsError] = useState<string | null>(null);
  const [windowsLoading, setWindowsLoading] = useState(false);

  const canQueryWindows = slotApisEnabled && isUuidLike(foId);

  useEffect(() => {
    if (!canQueryWindows) {
      setWindows(null);
      setWindowsError(null);
      setWindowsLoading(false);
      return;
    }

    let cancelled = false;
    const { rangeStart, rangeEnd } = slotRangeIso();

    async function run() {
      setWindowsLoading(true);
      setWindowsError(null);
      try {
        const list = await getBookingAvailabilityWindows({
          foId,
          rangeStart,
          rangeEnd,
          durationMinutes: duration,
        });
        if (!cancelled) {
          setWindows(list);
        }
      } catch (e) {
        if (!cancelled) {
          setWindows(null);
          setWindowsError(
            e instanceof Error
              ? e.message
              : "Availability could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) setWindowsLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [canQueryWindows, foId, duration]);

  const selectedKey = useMemo(() => {
    if (
      sel?.mode !== "slot_selection" ||
      !sel.selectedSlotWindowStart ||
      !sel.selectedSlotWindowEnd
    ) {
      return "";
    }
    return `${sel.selectedSlotWindowStart}|${sel.selectedSlotWindowEnd}`;
  }, [sel?.mode, sel?.selectedSlotWindowStart, sel?.selectedSlotWindowEnd]);

  function selectWindow(w: BookingAvailabilityWindow) {
    if (!isUuidLike(foId)) return;
    const label = formatWindowLabel(w);
    const slotId = `${foId}:${w.startAt}:${w.endAt}`;
    onScheduleSelectionPatch({
      mode: "slot_selection",
      selectedSlotId: slotId,
      selectedSlotLabel: label,
      selectedSlotDate: dateOnlyFromIso(w.startAt),
      selectedSlotWindowStart: w.startAt,
      selectedSlotWindowEnd: w.endAt,
      selectedSlotFoId: foId,
      holdId: null,
      holdExpiresAt: null,
      slotHoldConfirmed: false,
    });
  }

  function usePreferenceOnlyPath() {
    onScheduleSelectionPatch({
      mode: "preference_only",
      selectedSlotId: null,
      selectedSlotLabel: null,
      selectedSlotDate: null,
      selectedSlotWindowStart: null,
      selectedSlotWindowEnd: null,
      selectedSlotFoId: null,
      holdId: null,
      holdExpiresAt: null,
      slotHoldConfirmed: false,
    });
  }

  const showEmptyWindowsFallback =
    canQueryWindows &&
    !windowsLoading &&
    !windowsError &&
    windows !== null &&
    windows.length === 0;

  return (
    <BookingSectionCard
      eyebrow="Step 4"
      title="Choose your schedule"
      body="Pick cadence and timing. When you are signed in and have selected a preferred team, we can load real arrival windows for that team. Otherwise we capture honest timing preferences — dispatch still confirms the final visit time."
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
          Arrival windows (when available)
        </p>
        {!slotApisEnabled ? (
          <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
            Sign in as a customer to load live arrival windows. You can still
            continue with timing preferences below — that path is fully supported
            and intentional.
          </p>
        ) : !isUuidLike(foId) ? (
          <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
            Choose a <span className="font-medium text-[#0F172A]">preferred team</span>{" "}
            below so we know which provider&apos;s calendar to query. If you prefer not
            to pick a team, use timing preferences — dispatch will propose availability.
          </p>
        ) : windowsLoading ? (
          <p className="text-sm text-[#64748B]">Loading availability…</p>
        ) : windowsError ? (
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">Could not load live windows</p>
            <p className="mt-1 text-amber-900/90">{windowsError}</p>
            <p className="mt-2 text-amber-900/80">
              Continue with timing preferences — this is a normal fallback when
              availability data is unavailable.
            </p>
          </div>
        ) : showEmptyWindowsFallback ? (
          <div className="rounded-xl border border-[#C9B27C]/20 bg-white/60 px-4 py-3 text-sm text-[#475569]">
            No discrete windows matched this duration in the next two weeks for
            this team. Use timing preferences below, or try another preferred team.
          </div>
        ) : windows && windows.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-[#64748B]">
              Select an arrival window. Your booking is finalized after checkout
              steps reserve the slot on our servers (short-lived technical hold).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {windows.map((w) => {
                const key = `${w.startAt}|${w.endAt}`;
                const selected = key === selectedKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectWindow(w)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      selected
                        ? "border-[#0D9488]/50 bg-[#ecfdf5] text-[#064e3b]"
                        : "border-[#C9B27C]/25 bg-white text-[#0F172A] hover:border-[#0D9488]/30"
                    }`}
                  >
                    <span className="font-medium">{formatWindowLabel(w)}</span>
                  </button>
                );
              })}
            </div>
            {sel?.mode === "slot_selection" ? (
              <button
                type="button"
                className="text-sm font-medium text-[#0D9488] underline-offset-2 hover:underline"
                onClick={usePreferenceOnlyPath}
              >
                Use timing preferences instead of a fixed window
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-10 space-y-4 border-t border-[#C9B27C]/14 pt-8">
        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
          Visit timing preferences
        </p>
        <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
          {sel?.mode === "slot_selection"
            ? "These preferences add context alongside your selected arrival window."
            : "Day-level preferences help dispatch propose visits. This is not a confirmed calendar slot unless you selected an arrival window above."}
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
