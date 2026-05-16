import type { ReactNode } from "react";

type BookingSectionCardProps = {
  eyebrow: string;
  title: string;
  body?: string;
  children: ReactNode;
};

export function BookingSectionCard({
  eyebrow,
  title,
  body,
  children,
}: BookingSectionCardProps) {
  return (
    <section className="rounded-[28px] border border-[#E8DFD0]/95 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.32)] sm:p-8 lg:p-10">
      <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-4xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 max-w-3xl font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
          {body}
        </p>
      ) : null}

      <div className="mt-8">{children}</div>
    </section>
  );
}
