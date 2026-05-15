import type { ReactNode } from "react";
import clsx from "clsx";

type MarketingRichSectionProps = {
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
  id?: string;
  sectionClassName?: string;
};

export function MarketingRichSection({
  eyebrow,
  title,
  body,
  children,
  id,
  sectionClassName,
}: MarketingRichSectionProps) {
  return (
    <section
      id={id}
      className={clsx("scroll-mt-28 mx-auto max-w-7xl px-6 py-20 md:px-8", sectionClassName)}
    >
      <div className="grid gap-8 rounded-[36px] border border-[#C9B27C]/16 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.06)] lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
        <div>
          <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
            {eyebrow}
          </p>
          <h2 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.035em] text-[#0F172A] md:text-5xl">
            {title}
          </h2>
        </div>

        <div className="space-y-5">
          <p className="font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
            {body}
          </p>
          {children}
        </div>
      </div>
    </section>
  );
}
