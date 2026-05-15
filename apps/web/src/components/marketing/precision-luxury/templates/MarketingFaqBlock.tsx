type MarketingFaq = {
  q: string;
  a: string;
};

type MarketingFaqBlockProps = {
  eyebrow: string;
  title: string;
  items: MarketingFaq[];
  id?: string;
};

export function MarketingFaqBlock({
  eyebrow,
  title,
  items,
  id,
}: MarketingFaqBlockProps) {
  return (
    <section id={id} className="scroll-mt-28 mx-auto max-w-7xl px-6 pb-24 md:px-8">
      <div className="max-w-3xl">
        <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
          {eyebrow}
        </p>
        <h2 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.035em] text-[#0F172A] md:text-5xl">
          {title}
        </h2>
      </div>

      <div className="mt-12 space-y-5">
        {items.map((item) => (
          <div
            key={item.q}
            className="rounded-[24px] border border-[#C9B27C]/16 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.04)]"
          >
            <h3 className="font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">
              {item.q}
            </h3>
            <p className="mt-3 max-w-4xl font-[var(--font-manrope)] text-base leading-8 text-[#475569]">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
