type AdminStatusBadgeProps = {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
};

const variantClasses: Record<NonNullable<AdminStatusBadgeProps["variant"]>, string> = {
  default: "bg-gray-100 text-gray-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
};

export function AdminStatusBadge({ label, variant = "default" }: AdminStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}
