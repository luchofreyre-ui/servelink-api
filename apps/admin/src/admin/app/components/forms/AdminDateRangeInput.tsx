type AdminDateRangeInputProps = {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  label?: string;
  className?: string;
};

export function AdminDateRangeInput({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  label,
  className = "",
}: AdminDateRangeInputProps) {
  return (
    <div className={className}>
      {label ? (
        <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
        <span className="text-sm text-gray-500">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
    </div>
  );
}
