type BookingSelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  helper?: string;
};

export function BookingSelectField({
  label,
  value,
  onChange,
  options,
  helper,
}: BookingSelectFieldProps) {
  return (
    <div>
      <label className="mb-2 block font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#C9B27C]/18 bg-white px-4 py-3 font-[var(--font-manrope)] text-sm text-[#0F172A] shadow-sm outline-none transition focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {helper ? (
        <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#475569]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
