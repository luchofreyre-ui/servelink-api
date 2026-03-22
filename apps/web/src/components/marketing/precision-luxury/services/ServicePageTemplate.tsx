import { PublicSiteHeader } from "../layout/PublicSiteHeader";
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ServicePageTemplate({ page }: ServicePageTemplateProps) {
  const relatedContent = getRelatedPublicContentBySlug(page.slug);

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

      <PublicSiteHeader />

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

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-8">
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

        <section className="mx-auto max-w-7xl px-6 pb-20 md:px-8">
          <div className="max-w-3xl">
            <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
              How the page should educate
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

        <MarketingRichSection
          eyebrow="Positioning"
          title={page.positioningTitle}
          body={page.positioningBody}
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
          eyebrow="FAQ sample"
          title={page.faqTitle}
          items={page.faqs}
        />

        <MarketingCtaBand
          eyebrow="Ready to book"
          title="Move from service understanding into a premium booking path."
          body="Service pages should educate clearly, reinforce the brand standard, and make the next step obvious."
        />
      </main>

      <PublicSiteFooter />
    </div>
  );
}
