type MarketingCtaBandProps = {
  eyebrow: string;
  title: string;
  body: string;
};

export function MarketingCtaBand({
  eyebrow,
  title,
  body,
}: MarketingCtaBandProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
      <div className="rounded-[38px] border border-[#C9B27C]/18 bg-[linear-gradient(135deg,#0F172A_0%,#122433_55%,#0D9488_140%)] px-8 py-12 text-white shadow-[0_26px_90px_rgba(15,23,42,0.18)] lg:px-12 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
              {eyebrow}
            </p>
            <h2 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
              {title}
            </h2>
            <p className="mt-5 max-w-2xl font-[var(--font-manrope)] text-lg leading-8 text-white/75">
              {body}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:items-end">
            <button className="rounded-full bg-white px-7 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:-translate-y-0.5">
              Start Booking
            </button>
            <button className="rounded-full border border-white/20 px-7 py-4 font-[var(--font-manrope)] text-base font-semibold text-white transition hover:bg-white/10">
              Explore Services
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
