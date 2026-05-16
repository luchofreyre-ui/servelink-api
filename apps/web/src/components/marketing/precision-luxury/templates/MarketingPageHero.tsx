import { MarketingLinkButton } from "../shared/MarketingLinkButton";

type MarketingPageHeroProps = {
  eyebrow: string;
  title: string;
  body: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaHref?: string;
};

export function MarketingPageHero({
  eyebrow,
  title,
  body,
  primaryCtaLabel = "Book Cleaning",
  secondaryCtaLabel = "Explore Services",
  primaryCtaHref = "/book",
  secondaryCtaHref = "/services",
}: MarketingPageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,178,124,0.12),transparent_30%),radial-gradient(circle_at_right,rgba(13,148,136,0.08),transparent_24%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        <div className="overflow-hidden rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-5 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-7 lg:p-9">
          <div className="max-w-4xl rounded-[28px] border border-[#E8DFD0]/80 bg-white/76 p-6 sm:p-8">
          <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-[var(--font-poppins)] text-[2.35rem] font-semibold leading-[1.03] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.1rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl font-[var(--font-manrope)] text-lg leading-8 text-[#475569] md:text-xl">
            {body}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <MarketingLinkButton href={primaryCtaHref} variant="primary">
              {primaryCtaLabel}
            </MarketingLinkButton>
            <MarketingLinkButton href={secondaryCtaHref} variant="secondary">
              {secondaryCtaLabel}
            </MarketingLinkButton>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
