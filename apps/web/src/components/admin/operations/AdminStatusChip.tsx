import clsx from "clsx";

type AdminStatusChipProps = {
  label: string;
  variant?: "neutral" | "info" | "warning" | "success" | "danger";
  className?: string;
};

const variantClass: Record<NonNullable<AdminStatusChipProps["variant"]>, string> = {
  neutral: "border-white/15 bg-white/5 text-white/80",
  info: "border-sky-500/40 bg-sky-500/15 text-sky-100",
  warning: "border-amber-500/40 bg-amber-500/15 text-amber-100",
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-100",
  danger: "border-rose-500/40 bg-rose-500/15 text-rose-100",
};

export function AdminStatusChip({ label, variant = "neutral", className }: AdminStatusChipProps) {
  return (
    <span
      className={clsx(
        "inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        variantClass[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
