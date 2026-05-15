import Link from "next/link";

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
import { MarketingRichSection } from "./MarketingRichSection";
import type { PublicArticleEntry } from "../content/publicContentRegistry";
import {
  EditorialBreadcrumb,
  EditorialHero,
  EditorialMediaFrame,
  EditorialTrustStrip,
} from "@/components/marketing/precision-luxury/ui/PremiumEditorialPrimitives";

type MarketingArticleTemplateProps = {
  article: PublicArticleEntry;
};

function asideImageSrc(slug: string): string {
  const rotation = ["/media/trust/oop-walkthrough.jpg", "/media/trust/oop-quality-inspection.jpg", "/media/services/move-transition.jpg"];
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash + slug.charCodeAt(i) * (i + 1)) % rotation.length;
  return rotation[hash] ?? rotation[0]!;
}

export function MarketingArticleTemplate({ article }: MarketingArticleTemplateProps) {
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
        <section className="mx-auto max-w-7xl px-6 pb-10 pt-12 md:px-8 md:pt-16">
          <EditorialBreadcrumb
            items={[
              { label: "Home", href: "/" },
              ...(article.kind === "question" ? [{ label: "Questions" }] : [{ label: "Guides", href: "/guides" }]),
              { label: article.title },
            ]}
          />

          <div className="mt-8">
            <EditorialHero
              eyebrow={article.eyebrow}
              title={article.title}
              body={article.heroBody}
              aside={
                <EditorialMediaFrame
                  src={asideImageSrc(article.slug)}
                  alt="Nu Standard editorial photography supporting educational cleaning guidance."
                />
              }
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-4 border-t border-[#E8DFD0]/90 pt-8 font-[var(--font-manrope)] text-sm text-[#475569]">
            <Link href="/book" className="font-semibold text-[#0D9488] underline-offset-4 hover:underline">
              Book a cleaning
            </Link>
            <span aria-hidden className="text-[#CBD5E1]">
              ·
            </span>
            <Link href="/services" className="font-semibold text-[#0D9488] underline-offset-4 hover:underline">
              Explore services
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 pb-16 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_288px] lg:items-start">
            <div>
              <MarketingRichSection
                id="section-one"
                sectionClassName="px-0 py-14 md:py-16"
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
                id="section-two"
                sectionClassName="px-0 py-0 md:py-4"
                eyebrow={article.sectionTwo.eyebrow}
                title={article.sectionTwo.title}
                body={article.sectionTwo.body}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {article.sectionTwo.points.map((point) => (
                    <div key={point} className="rounded-[24px] border border-[#C9B27C]/16 bg-white p-5">
                      <div className="mb-4 h-px w-12 bg-[#C9B27C]" />
                      <p className="font-[var(--font-manrope)] text-base leading-7 text-[#0F172A]">{point}</p>
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

              <div className="mt-12 lg:hidden">
                <EditorialTrustStrip
                  variant="dense"
                  items={[
                    { title: "Surface-First" },
                    { title: "Test First" },
                    { title: "Gentle Approach" },
                    { title: "Know When to Stop" },
                  ]}
                />
              </div>
            </div>

            <aside className="hidden space-y-8 lg:block lg:sticky lg:top-28">
              <div className="rounded-[18px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.28)]">
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                  Key takeaway
                </p>
                <p className="mt-3 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">
                  {article.sectionOne.callout}
                </p>
              </div>

              <div className="rounded-[18px] border border-[#E8DFD0]/95 bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.28)]">
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                  In this guide
                </p>
                <ul className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm text-[#475569]">
                  <li>
                    <a href="#section-one" className="font-semibold text-[#0D9488] hover:underline">
                      {article.sectionOne.title}
                    </a>
                  </li>
                  <li>
                    <a href="#section-two" className="font-semibold text-[#0D9488] hover:underline">
                      {article.sectionTwo.title}
                    </a>
                  </li>
                  <li>
                    <a href="#article-faq" className="font-semibold text-[#0D9488] hover:underline">
                      {article.faqTitle}
                    </a>
                  </li>
                </ul>
              </div>

              {relatedContent.length > 0 ? (
                <div className="rounded-[18px] border border-[#E8DFD0]/95 bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.28)]">
                  <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                    {article.kind === "question" ? "Related answers" : "Related guides"}
                  </p>
                  <ul className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm">
                    {relatedContent.map((item) => (
                      <li key={item.slug}>
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
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <EditorialTrustStrip
                variant="dense"
                items={[
                  { title: "Surface-First" },
                  { title: "Test First" },
                  { title: "Gentle Approach" },
                  { title: "Know When to Stop" },
                ]}
              />
            </aside>
          </div>
        </div>

        <MarketingFaqBlock
          id="article-faq"
          eyebrow="Common questions"
          title={article.faqTitle}
          items={article.faqs}
        />

        <MarketingCtaBand eyebrow="Ready to book" title={article.ctaTitle} body={article.ctaBody} />

        {article.kind === "guide" ? (
          <div className="mx-auto max-w-7xl px-6 pb-16 md:px-8">
            <p className="font-[var(--font-manrope)] text-center text-xs text-[#64748B]">
              Prefer browsing more references first?{" "}
              <Link href="/guides" className="font-semibold text-[#0D9488] hover:underline">
                Browse guides
              </Link>
            </p>
          </div>
        ) : null}
      </main>

      <PublicSiteFooter />
    </div>
  );
}
