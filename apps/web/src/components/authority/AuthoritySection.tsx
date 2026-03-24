import type { ReactNode } from "react";

export function AuthoritySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">{title}</h2>
      <div className="space-y-4 font-[var(--font-manrope)] text-[#475569]">{children}</div>
    </section>
  );
}
