import { PublicSiteHeader } from "../layout/PublicSiteHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import { getRelatedPublicContentBySlug } from "../content/publicContentSelectors";
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
} from "../content/publicContentSchemas";
import { MarketingInlineLink } from "../shared/MarketingInlineLink";
import { MarketingCtaBand } from "./MarketingCtaBand";
import { MarketingFaqBlock } from "./MarketingFaqBlock";
import { MarketingPageHero } from "./MarketingPageHero";
import { MarketingRichSection } from "./MarketingRichSection";
import type { PublicArticleEntry } from "../content/publicContentRegistry";

type MarketingArticleTemplateProps = {
  article: PublicArticleEntry;
};

export function MarketingArticleTemplate({
  article,
}: MarketingArticleTemplateProps) {
  const relatedContent = getRelatedPublicContentBySlug(article.slug);

  const schemas = [
    buildArticleSchema(article),
    buildFAQSchema(article.faqs),
    buildBreadcrumbSchema([
      { name: "Home", url: "https://nustandardcleaning.com/" },
      {
        name: article.kind === "question" ? "Questions" : "Guides",
        url:
          article.kind === "question"
            ? "https://nustandardcleaning.com/questions/how-often-should-a-house-be-cleaned"
            : "https://nustandardcleaning.com/guides/deep-cleaning-vs-recurring-cleaning",
      },
      {
        name: article.title,
        url:
          article.kind === "question"
            ? `https://nustandardcleaning.com/questions/${article.slug}`
            : `https://nustandardcleaning.com/guides/${article.slug}`,
      },
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
          eyebrow={article.eyebrow}
          title={article.title}
          body={article.heroBody}
          primaryCtaLabel="Book Cleaning"
          secondaryCtaLabel="Explore Services"
          primaryCtaHref="/book"
          secondaryCtaHref="/services"
        />

        <MarketingRichSection
          eyebrow={article.sectionOne.eyebrow}
          title={article.sectionOne.title}
          body={article.sectionOne.body}
        >
          <div className="rounded-[24px] bg-[#FFF9F3] p-5 ring-1 ring-[#C9B27C]/18">
            <p className="font-[var(--font-manrope)] text-base font-medium text-[#0F172A]">
              {article.sectionOne.callout}
            </p>
          </div>
        </MarketingRichSection>

        <MarketingRichSection
          eyebrow={article.sectionTwo.eyebrow}
          title={article.sectionTwo.title}
          body={article.sectionTwo.body}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {article.sectionTwo.points.map((point) => (
              <div
                key={point}
                className="rounded-[24px] border border-[#C9B27C]/16 bg-white p-5"
              >
                <div className="mb-4 h-px w-12 bg-[#C9B27C]" />
                <p className="font-[var(--font-manrope)] text-base leading-7 text-[#0F172A]">
                  {point}
                </p>
              </div>
            ))}
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
          eyebrow="Common questions"
          title={article.faqTitle}
          items={article.faqs}
        />

        <MarketingCtaBand
          eyebrow="Ready to book"
          title={article.ctaTitle}
          body={article.ctaBody}
        />
      </main>

      <PublicSiteFooter />
    </div>
  );
}
