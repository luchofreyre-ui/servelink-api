import Image from "next/image";
import { ServiceHeader } from "../layout/ServiceHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import { getRelatedPublicContentBySlug } from "../content/publicContentSelectors";
import {
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildServiceSchema,
} from "../content/publicContentSchemas";
import { MarketingInlineLink } from "../shared/MarketingInlineLink";
import { MarketingFaqBlock } from "../templates/MarketingFaqBlock";
import { MarketingPageHero } from "../templates/MarketingPageHero";
import { MarketingRichSection } from "../templates/MarketingRichSection";
import { MarketingCtaBand } from "../templates/MarketingCtaBand";
import type { PublicServiceEntry } from "../content/publicContentRegistry";

type ServicePageTemplateProps = {
  page: PublicServiceEntry;
};

const serviceMedia: Record<
  string,
  {
    src: string;
    alt: string;
    caption: string;
  }
> = {
  "deep-cleaning": {
    src: "/media/services/deep-cleaning.jpg",
    alt: "Detailed home reset with bright residential surfaces prepared for deeper cleaning.",
    caption: "A deeper reset focuses on the rooms and details that make the home feel behind.",
  },
  "recurring-home-cleaning": {
    src: "/media/services/recurring-cleaning.jpg",
    alt: "Calm residential room prepared for recurring home cleaning maintenance.",
    caption: "Recurring care protects the baseline so the home feels easier to maintain.",
  },
  "move-in-move-out": {
    src: "/media/services/move-transition.jpg",
    alt: "Orderly entryway prepared for move-in or move-out transition cleaning.",
    caption: "Transition cleaning supports a cleaner handoff, listing, or fresh start.",
  },
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ServicePageTemplate({ page }: ServicePageTemplateProps) {
  const relatedContent = getRelatedPublicContentBySlug(page.slug);
  const media = serviceMedia[page.slug];

  const schemas = [
    buildServiceSchema(page),
    buildFAQSchema(page.faqs),
    buildBreadcrumbSchema([
      { name: "Home", url: "https://nustandardcleaning.com/" },
      { name: "Services", url: "https://nustandardcleaning.com/services" },
      { name: page.title, url: `https://nustandardcleaning.com/services/${page.slug}` },
    ]),
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <ServiceHeader />

      <main>
        <MarketingPageHero
          eyebrow={page.eyebrow}
          title={page.title}
          body={page.heroBody}
          primaryCtaLabel={page.primaryCtaLabel}
          secondaryCtaLabel={page.secondaryCtaLabel}
          primaryCtaHref={`/book?service=${page.slug}`}
          secondaryCtaHref="/services"
        />

        {media ? (
          <section className="mx-auto max-w-7xl px-6 pt-10 md:px-8 md:pt-12">
            <div className="grid overflow-hidden rounded-[34px] border border-[#C9B27C]/16 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="relative min-h-[230px] bg-[#F4EFE8] sm:min-h-[310px] lg:min-h-[430px]">
                <Image
                  src={media.src}
                  alt={media.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  className="object-cover object-center"
                  priority={false}
                />
              </div>
              <div className="flex flex-col justify-center px-6 py-7 sm:px-8 lg:px-10">
                <p className="font-[var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.24em] text-[#C9B27C]">
                  {page.serviceDepth.summaryEyebrow}
                </p>
                <h2 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#0F172A] md:text-4xl">
                  {page.serviceDepth.summaryTitle}
                </h2>
                <p className="mt-4 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
                  {page.serviceDepth.summaryBody}
                </p>
                <p className="mt-5 rounded-2xl border border-[#C9B27C]/18 bg-[#FFF9F3] px-4 py-3 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                  {media.caption}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-6 py-14 md:px-8 md:py-16">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div className="rounded-[30px] border border-[#C9B27C]/16 bg-[#0F172A] p-7 text-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                Best for
              </p>
              <h2 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.03em] text-white">
                Choose this service when these needs sound familiar.
              </h2>
              <div className="mt-7 grid gap-3">
                {page.serviceDepth.bestFor.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="font-[var(--font-manrope)] text-sm leading-6 text-white/85">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {page.serviceDepth.focusAreas.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[26px] border border-[#C9B27C]/16 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
                >
                  <p className="font-[var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.18em] text-[#C9B27C]">
                    Focus
                  </p>
                  <h3 className="mt-4 font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-14 md:px-8 md:pb-16">
          <div className="max-w-3xl">
            <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
              Room and zone detail
            </p>
            <h2 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.035em] text-[#0F172A] md:text-5xl">
              Where attention usually goes.
            </h2>
            <p className="mt-5 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
              Each home is different, but these zones usually shape the service plan and the way the result is felt afterward.
            </p>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {page.serviceDepth.zones.map((zone) => (
              <div
                key={zone.zone}
                className="rounded-[28px] border border-[#C9B27C]/16 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
              >
                <h3 className="font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                  {zone.zone}
                </h3>
                <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                  {zone.emphasis}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {zone.examples.map((example) => (
                    <span
                      key={example}
                      className="rounded-full border border-[#C9B27C]/18 bg-[#FFF9F3] px-3 py-1.5 font-[var(--font-manrope)] text-xs font-semibold text-[#334155]"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-14 md:px-8 md:pb-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[30px] border border-[#C9B27C]/16 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                What&apos;s included
              </p>
              <h2 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                {page.includedTitle}
              </h2>

              <div className="mt-8 space-y-4">
                {page.includedItems.map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-2xl bg-[#FFF9F3] px-4 py-4 ring-1 ring-[#C9B27C]/14"
                  >
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#0D9488]/10 text-[#0D9488]">
                      <CheckIcon />
                    </div>
                    <p className="font-[var(--font-manrope)] text-base leading-7 text-[#0F172A]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#C9B27C]/16 bg-[#0F172A] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                What this is not
              </p>
              <h2 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.03em] text-white">
                {page.notIncludedTitle}
              </h2>

              <div className="mt-8 space-y-4">
                {page.notIncludedItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm"
                  >
                    <p className="font-[var(--font-manrope)] text-base leading-7 text-white/85">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-14 md:px-8 md:pb-16">
          <div className="max-w-3xl">
            <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
              How the service works
            </p>
            <h2 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.035em] text-[#0F172A] md:text-5xl">
              {page.processTitle}
            </h2>
            <p className="mt-5 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
              {page.processBody}
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {page.processSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-[28px] border border-[#C9B27C]/16 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.05em] text-[#0F172A]">
                    {item.step}
                  </span>
                  <div className="h-px w-16 bg-[#C9B27C]" />
                </div>
                <h3 className="mt-8 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                  {item.title}
                </h3>
                <p className="mt-4 font-[var(--font-manrope)] text-base leading-8 text-[#475569]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-14 md:px-8 md:pb-16">
          <div className="grid gap-5 rounded-[34px] border border-[#C9B27C]/16 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:p-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:p-10">
            <div>
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                After the visit
              </p>
              <h2 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-4xl">
                What clients usually notice first.
              </h2>
              <p className="mt-4 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
                Results vary with the home&apos;s starting condition, but the service is planned so the improvement is practical, visible, and easier to maintain.
              </p>
            </div>
            <div className="grid gap-3">
              {page.serviceDepth.afterVisit.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-[#FFF9F3] px-4 py-4 ring-1 ring-[#C9B27C]/14">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0D9488]/10 text-[#0D9488]">
                    <CheckIcon />
                  </div>
                  <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <MarketingRichSection
          eyebrow="Service fit"
          title={page.serviceDepth.differentiation.title}
          body={page.serviceDepth.differentiation.body}
          sectionClassName="py-0 pb-14 md:pb-16"
        >
          <div className="rounded-[24px] bg-[#FFF9F3] p-5 ring-1 ring-[#C9B27C]/18">
            <p className="font-[var(--font-manrope)] text-base font-medium text-[#0F172A]">
              {page.positioningCallout}
            </p>
          </div>

          {relatedContent.length > 0 ? (
            <div className="rounded-[24px] border border-[#C9B27C]/16 bg-white p-5">
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.22em] text-[#C9B27C]">
                Related reading
              </p>
              <div className="mt-4 space-y-3">
                {relatedContent.map((item) => (
                  <div key={item.slug}>
                    <MarketingInlineLink
                      href={
                        item.kind === "service"
                          ? `/services/${item.slug}`
                          : item.kind === "question"
                            ? `/questions/${item.slug}`
                            : `/guides/${item.slug}`
                      }
                    >
                      {item.title}
                    </MarketingInlineLink>
                    <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </MarketingRichSection>

        <MarketingFaqBlock
          eyebrow="Service questions"
          title={page.faqTitle}
          items={page.faqs}
        />

        <MarketingCtaBand
          eyebrow="Ready to book"
          title="Book with clear service expectations."
          body="Review the service fit, share your home details, and choose the path that best matches the condition of the space."
        />
      </main>

      <PublicSiteFooter />
    </div>
  );
}
