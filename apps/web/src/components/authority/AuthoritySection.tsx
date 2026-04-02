import type { ReactNode } from "react";
import clsx from "clsx";

export function AuthoritySection({
  title,
  children,
  id,
  className,
}: {
  title: string;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={clsx("mb-14 scroll-mt-24", className)}>
      <h2 className="mb-4 font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">{title}</h2>
      <div className="space-y-4 font-[var(--font-manrope)] text-[#475569]">{children}</div>
    </section>
  );
}
