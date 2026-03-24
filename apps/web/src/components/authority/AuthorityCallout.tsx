import type { ReactNode } from "react";

const variantClass: Record<string, string> = {
  warning: "border-amber-200 bg-amber-50 text-[#78350F]",
  mistake: "border-rose-200 bg-rose-50 text-[#7F1D1D]",
  failure: "border-slate-200 bg-slate-50 text-[#0F172A]",
  escalate: "border-[#C9B27C]/40 bg-[#FFF9F3] text-[#0F172A]",
};

export function AuthorityCallout({
  variant,
  children,
}: {
  variant: "warning" | "mistake" | "failure" | "escalate";
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 font-[var(--font-manrope)] text-sm leading-6 ${variantClass[variant]}`}
    >
      {children}
    </div>
  );
}
