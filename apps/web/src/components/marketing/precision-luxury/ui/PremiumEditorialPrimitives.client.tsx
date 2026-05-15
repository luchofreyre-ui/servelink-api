"use client";

import type { ReactNode } from "react";
import { editorialInteractiveTransition } from "./PremiumEditorialPrimitives";

export type EditorialFilterChip = { key: string; label: string };

export function EditorialFilterChips({
  chips,
  activeKey,
  onChange,
  ariaLabel = "Filters",
}: {
  chips: EditorialFilterChip[];
  activeKey: string;
  onChange: (key: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = chip.key === activeKey;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.key)}
            className={`rounded-full border px-3.5 py-1.5 font-[var(--font-manrope)] text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#C9B27C]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9F3] ${editorialInteractiveTransition} ${
              active
                ? "border-[#C9B27C]/55 bg-[#F5EFE3] text-[#0F172A] shadow-[0_8px_22px_-14px_rgba(15,23,42,0.35)]"
                : "border-[#E8DFD0]/95 bg-white/90 text-[#475569] hover:border-[#C9B27C]/35 hover:bg-[#FFFCF7]"
            } active:translate-y-px`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

export function EditorialSearchPanel({
  placeholder,
  value,
  onChange,
  footer,
  chips,
}: {
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  footer?: ReactNode;
  chips?: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-5 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.35)] sm:p-6">
      <label htmlFor="editorial-search-input" className="sr-only">
        Search
      </label>
      <input
        id="editorial-search-input"
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border border-[#E8DFD0]/90 bg-white px-4 py-3 font-[var(--font-manrope)] text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus-visible:border-[#C9B27C]/45 focus-visible:ring-2 focus-visible:ring-[#C9B27C]/35 ${editorialInteractiveTransition}`}
      />
      {chips ? <div className="mt-4">{chips}</div> : null}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
