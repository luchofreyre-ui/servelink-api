import clsx from "clsx";
import { labelSlaState } from "./adminOperationsLabels";

type Sla = "dueSoon" | "overdue" | "breached";

type AdminSlaChipProps = {
  slaState: Sla | string | null | undefined;
  className?: string;
};

export function AdminSlaChip({ slaState, className }: AdminSlaChipProps) {
  if (!slaState) return null;
  const label = labelSlaState(slaState);
  if (!label) return null;

  const variant =
    slaState === "breached"
      ? "border-rose-500/50 bg-rose-500/20 text-rose-50"
      : slaState === "overdue"
        ? "border-orange-500/50 bg-orange-500/20 text-orange-50"
        : "border-amber-400/50 bg-amber-400/15 text-amber-50";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        variant,
        className,
      )}
    >
      {label}
    </span>
  );
}
