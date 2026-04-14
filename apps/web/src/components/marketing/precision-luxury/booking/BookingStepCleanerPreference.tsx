"use client";

import type { CleanerPreference } from "./bookingFlowTypes";

type Props = {
  value: CleanerPreference | undefined;
  onChange: (next: CleanerPreference) => void;
};

export function BookingStepCleanerPreference({ value, onChange }: Props) {
  const mode = value?.mode ?? "none";
  const notes = value?.preferenceNotes ?? "";
  const hard = Boolean(value?.hardRequirement);

  return (
    <div className="space-y-4 rounded-2xl border border-[#C9B27C]/16 bg-white p-5 ring-1 ring-[#C9B27C]/10">
      <div>
        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
          Cleaner preference
        </p>
        <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
          Request a preferred team when you have one in mind. We do not show individual
          provider cards until a supported directory API is wired to this funnel.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={`rounded-full border px-4 py-2 font-[var(--font-manrope)] text-sm font-medium transition ${
            mode === "none"
              ? "border-[#0D9488] bg-[rgba(13,148,136,0.08)] text-[#0F766E]"
              : "border-[#C9B27C]/25 text-[#0F172A] hover:border-[#C9B27C]/45"
          }`}
          onClick={() => onChange({ mode: "none" })}
        >
          No preference
        </button>
        <button
          type="button"
          className={`rounded-full border px-4 py-2 font-[var(--font-manrope)] text-sm font-medium transition ${
            mode === "preferred_cleaner"
              ? "border-[#0D9488] bg-[rgba(13,148,136,0.08)] text-[#0F766E]"
              : "border-[#C9B27C]/25 text-[#0F172A] hover:border-[#C9B27C]/45"
          }`}
          onClick={() =>
            onChange({
              mode: "preferred_cleaner",
              cleanerId: value?.cleanerId,
              cleanerLabel: value?.cleanerLabel,
              hardRequirement: value?.hardRequirement,
              preferenceNotes: value?.preferenceNotes,
            })
          }
        >
          Request a preferred cleaner / team
        </button>
      </div>

      {mode === "preferred_cleaner" ? (
        <div className="space-y-3">
          <label
            className="block font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]"
            htmlFor="cleaner-preference-notes"
          >
            Notes for dispatch (name, past visit, or team request)
          </label>
          <textarea
            id="cleaner-preference-notes"
            className="min-h-[96px] w-full rounded-xl border border-[#C9B27C]/25 bg-white px-3 py-2 font-[var(--font-manrope)] text-sm text-[#0F172A] outline-none ring-1 ring-[#C9B27C]/10 focus:border-[#0D9488]/40"
            placeholder="Example: “We loved Maria’s team on our last deep clean.”"
            value={notes}
            onChange={(e) =>
              onChange({
                mode: "preferred_cleaner",
                preferenceNotes: e.target.value || null,
                hardRequirement: hard,
              })
            }
          />
          <label className="flex cursor-pointer items-center gap-2 font-[var(--font-manrope)] text-sm text-[#0F172A]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#C9B27C]/40 text-[#0D9488]"
              checked={hard}
              onChange={(e) =>
                onChange({
                  mode: "preferred_cleaner",
                  preferenceNotes: notes || null,
                  hardRequirement: e.target.checked,
                })
              }
            />
            Hard requirement — only assign this cleaner/team when availability allows
          </label>
        </div>
      ) : null}
    </div>
  );
}
