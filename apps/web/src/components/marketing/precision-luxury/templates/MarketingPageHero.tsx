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
    <section className="relative overflow-hidden border-b border-[#C9B27C]/14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,178,124,0.15),transparent_30%),radial-gradient(circle_at_right,rgba(13,148,136,0.10),transparent_24%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-8 lg:py-24">
        <div className="max-w-4xl">
          <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-[var(--font-poppins)] text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#0F172A] md:text-6xl">
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
    </section>
  );
}
