type BookingFieldProps = {
  label: string;
  value: string;
  helper?: string;
};

export function BookingField({ label, value, helper }: BookingFieldProps) {
  return (
    <div>
      <label className="mb-2 block font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
        {label}
      </label>
      <div className="rounded-2xl border border-[#C9B27C]/18 bg-white px-4 py-3 font-[var(--font-manrope)] text-sm text-[#0F172A] shadow-sm">
        {value}
      </div>
      {helper ? (
        <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#475569]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
