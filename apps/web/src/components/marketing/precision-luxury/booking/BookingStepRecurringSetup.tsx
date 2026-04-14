"use client";

import type {
  BookingEstimateSnapshot,
  RecurringCadence,
  RecurringSetupState,
  RecurringTimePreference,
} from "./bookingFlowTypes";

type FoOption = {
  id: string;
  label: string;
};

type AddonOption = {
  id: string;
  label: string;
  description?: string;
};

type Props = {
  cadence: RecurringCadence;
  estimateSnapshot: BookingEstimateSnapshot | null;
  value: RecurringSetupState;
  foOptions: FoOption[];
  addonOptions: AddonOption[];
  onChange: (next: RecurringSetupState) => void;
};

function cadenceLabel(c: RecurringCadence) {
  if (c === "weekly") return "Weekly";
  if (c === "biweekly") return "Bi-weekly";
  return "Monthly";
}

const TIME_OPTIONS: RecurringTimePreference[] = [
  "morning",
  "midday",
  "afternoon",
  "anytime",
];

export default function BookingStepRecurringSetup({
  cadence,
  estimateSnapshot,
  value,
  foOptions,
  addonOptions,
  onChange,
}: Props) {
  const minDate =
    typeof window !== "undefined"
      ? new Date().toISOString().slice(0, 10)
      : "";

  const setTimePreference = (timePreference: RecurringTimePreference) => {
    onChange({ ...value, timePreference });
  };

  const toggleAddon = (addonId: string) => {
    const exists = value.addonIds.includes(addonId);
    onChange({
      ...value,
      addonIds: exists
        ? value.addonIds.filter((id) => id !== addonId)
        : [...value.addonIds, addonId],
    });
  };

  const estimateLine =
    estimateSnapshot != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(estimateSnapshot.priceCents / 100)
      : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
          Set up your recurring plan
        </h2>
        <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
          Choose when your plan should start and how you want future visits handled.
        </p>
      </div>

      <div className="rounded-2xl border border-[#0D9488]/25 bg-[rgba(13,148,136,0.06)] px-4 py-3 font-[var(--font-manrope)] text-sm text-[#0F172A]">
        <p className="font-semibold text-[#0F766E]">Recurring intent</p>
        <p className="mt-1">
          Cadence: <span className="font-medium">{cadenceLabel(cadence)}</span>
          {estimateLine ? (
            <>
              {" "}
              — first visit priced from your locked review estimate:{" "}
              <span className="font-medium tabular-nums">{estimateLine}</span> (
              {estimateSnapshot?.durationMinutes ?? "—"} min, confidence{" "}
              {estimateSnapshot != null
                ? `${Math.round(estimateSnapshot.confidence * 100)}%`
                : "—"}
              )
            </>
          ) : (
            <span className="mt-1 block text-[#64748B]">
              Complete the review step so your estimate snapshot is available for plan creation.
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <label
            className="font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]"
            htmlFor="recurring-next-anchor-date"
          >
            First recurring visit date
          </label>
          <input
            id="recurring-next-anchor-date"
            type="date"
            min={minDate}
            className="w-full rounded-xl border border-[#C9B27C]/25 bg-white px-3 py-2 font-[var(--font-manrope)] text-sm text-[#0F172A] outline-none ring-1 ring-[#C9B27C]/10 focus:border-[#0D9488]/40"
            value={value.nextAnchorDate}
            onChange={(event) =>
              onChange({ ...value, nextAnchorDate: event.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <div className="font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
            Preferred arrival window
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`rounded-xl border px-4 py-3 font-[var(--font-manrope)] text-sm font-medium transition ${
                  value.timePreference === option
                    ? "border-[#0D9488] bg-[rgba(13,148,136,0.08)] text-[#0F766E]"
                    : "border-[#C9B27C]/25 text-[#0F172A] hover:border-[#C9B27C]/45"
                }`}
                onClick={() => setTimePreference(option)}
              >
                {option === "morning" && "Morning"}
                {option === "midday" && "Midday"}
                {option === "afternoon" && "Afternoon"}
                {option === "anytime" && "Any time"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]"
            htmlFor="recurring-preferred-fo"
          >
            Preferred cleaner (optional)
          </label>
          <select
            id="recurring-preferred-fo"
            className="w-full rounded-xl border border-[#C9B27C]/25 bg-white px-3 py-2 font-[var(--font-manrope)] text-sm text-[#0F172A] outline-none ring-1 ring-[#C9B27C]/10 focus:border-[#0D9488]/40"
            value={value.preferredFoId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                preferredFoId: event.target.value || undefined,
              })
            }
          >
            <option value="">No preference</option>
            {foOptions.map((fo) => (
              <option key={fo.id} value={fo.id}>
                {fo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
            Plan add-ons
          </div>
          <div className="grid gap-2">
            {addonOptions.map((addon) => {
              const selected = value.addonIds.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  className={`rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-[#0D9488] bg-[rgba(13,148,136,0.06)]"
                      : "border-[#C9B27C]/25 hover:border-[#C9B27C]/45"
                  }`}
                  onClick={() => toggleAddon(addon.id)}
                >
                  <div className="font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                    {addon.label}
                  </div>
                  {addon.description ? (
                    <div className="mt-1 font-[var(--font-manrope)] text-xs text-[#64748B]">
                      {addon.description}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]"
            htmlFor="recurring-booking-notes"
          >
            Recurring notes (optional)
          </label>
          <textarea
            id="recurring-booking-notes"
            className="min-h-[120px] w-full rounded-xl border border-[#C9B27C]/25 bg-white px-3 py-2 font-[var(--font-manrope)] text-sm text-[#0F172A] outline-none ring-1 ring-[#C9B27C]/10 focus:border-[#0D9488]/40"
            value={value.bookingNotes ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                bookingNotes: event.target.value.trim()
                  ? event.target.value
                  : undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
