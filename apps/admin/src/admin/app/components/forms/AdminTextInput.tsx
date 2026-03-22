type AdminTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  type?: "text" | "search" | "email" | "date";
  className?: string;
};

export function AdminTextInput({
  value,
  onChange,
  placeholder,
  label,
  id,
  type = "text",
  className = "",
}: AdminTextInputProps) {
  const inputId = id ?? `admin-input-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
      />
    </div>
  );
}
