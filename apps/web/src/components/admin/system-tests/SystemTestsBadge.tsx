"use client";

import clsx from "clsx";

export type SystemTestsBadgeVariant =
  | "flaky"
  | "persistent"
  | "newRegression"
  | "resolved"
  | "critical"
  | "warning"
  | "stable";

const styles: Record<SystemTestsBadgeVariant, string> = {
  flaky: "bg-amber-500/20 text-amber-100 ring-amber-500/35",
  persistent: "bg-orange-500/20 text-orange-100 ring-orange-500/35",
  newRegression: "bg-red-500/25 text-red-100 ring-red-500/40",
  resolved: "bg-emerald-500/20 text-emerald-100 ring-emerald-500/35",
  critical: "bg-red-600/30 text-red-50 ring-red-500/50",
  warning: "bg-amber-600/25 text-amber-50 ring-amber-500/45",
  stable: "bg-slate-500/20 text-slate-100 ring-slate-500/35",
};

type Props = {
  variant: SystemTestsBadgeVariant;
  children: React.ReactNode;
  className?: string;
};

export function SystemTestsBadge(props: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
        styles[props.variant],
        props.className,
      )}
    >
      {props.children}
    </span>
  );
}
