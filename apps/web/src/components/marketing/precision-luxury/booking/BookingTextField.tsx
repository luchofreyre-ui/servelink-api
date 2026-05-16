import type { HTMLInputTypeAttribute } from "react";
import { NU_PREMIUM_TRANSITION } from "../ui/NuStandardPremiumPrimitives";

type BookingTextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  id?: string;
  invalid?: boolean;
};

export function BookingTextField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  type = "text",
  autoComplete,
  id,
  invalid,
}: BookingTextFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={`w-full rounded-2xl border bg-[#FFFCF8] px-4 py-3 font-[var(--font-manrope)] text-sm text-[#0F172A] shadow-sm outline-none ${NU_PREMIUM_TRANSITION} focus:bg-white focus:ring-4 ${
          invalid
            ? "border-[#B91C1C]/60 focus:border-[#B91C1C] focus:ring-[#B91C1C]/12"
            : "border-[#C9B27C]/18 focus:border-[#0D9488] focus:ring-[#0D9488]/10"
        }`}
      />

      {helper ? (
        <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#475569]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
