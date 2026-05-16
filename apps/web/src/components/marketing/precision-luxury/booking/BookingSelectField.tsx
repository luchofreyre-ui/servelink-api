export type BookingSelectFieldOption =
  | string
  | { value: string; label: string };

type BookingSelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: BookingSelectFieldOption[];
  /** Shown as the label for the empty `value=""` option (display-only; not written to state until user picks). */
  placeholder?: string;
  helper?: string;
  /** Associates `<label>` with `<select>` for accessibility. */
  id?: string;
  invalid?: boolean;
};

function optionKey(option: BookingSelectFieldOption, index: number, label: string) {
  if (option === "") return `__empty-${label}`;
  if (typeof option === "string") return `${option}-${index}`;
  return `${option.value}-${index}`;
}

function optionValue(option: BookingSelectFieldOption): string {
  if (typeof option === "string") return option;
  return option.value;
}

function optionMenuLabel(
  option: BookingSelectFieldOption,
  placeholder: string | undefined,
): string {
  if (option === "") return placeholder ?? "Select…";
  if (typeof option === "string") return option;
  return option.label;
}

export function BookingSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  helper,
  id,
  invalid,
}: BookingSelectFieldProps) {
  const selectId = id;

  return (
    <div>
      <label
        htmlFor={selectId}
        className="mb-2 block font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]"
      >
        {label}
      </label>

      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        className={`w-full rounded-2xl border bg-white px-4 py-3 font-[var(--font-manrope)] text-sm text-[#0F172A] shadow-sm outline-none transition focus:ring-4 ${
          invalid
            ? "border-[#B91C1C]/60 focus:border-[#B91C1C] focus:ring-[#B91C1C]/12"
            : "border-[#C9B27C]/18 focus:border-[#0D9488] focus:ring-[#0D9488]/10"
        }`}
      >
        {options.map((option, index) => (
          <option
            key={optionKey(option, index, label)}
            value={optionValue(option)}
          >
            {optionMenuLabel(option, placeholder)}
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
