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
    <section id={id} className={clsx("mb-10 scroll-mt-24", className)}>
      <h2 className="mb-3 font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A] md:text-2xl">
        {title}
      </h2>
      <div className="space-y-4 font-[var(--font-manrope)] text-sm leading-[1.4] text-[#475569] md:text-base">
        {children}
      </div>
    </section>
  );
}
