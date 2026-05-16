import type {
  AuthorityGuideCategory,
  AuthorityGuidePageData,
  AuthorityGuideSection,
} from "@/authority/types/authorityPageTypes";
import { getAllGuidePages } from "@/authority/data/authorityGuidePageData";
import { buildGuideFaqBlock } from "@/authority/data/authorityFaqSelectors";
import { buildGuideBreadcrumbs, buildGuideSeeAlso } from "@/authority/navigation/authorityNavigation";
import {
  buildArticleSchema,
  buildBreadcrumbListSchema,
  buildFaqSchema,
} from "@/authority/metadata/authoritySchema";
import {
  resolveCanonicalMetadataHref,
  resolveJsonLdBreadcrumbHrefs,
} from "@/lib/encyclopedia/encyclopediaCanonicalMetadataHref";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { MarketingLinkButton } from "@/components/marketing/precision-luxury/shared/MarketingLinkButton";
import {
  EditorialBreadcrumb,
  EditorialMediaFrame,
  EditorialTrustStrip,
  editorialInteractiveTransition,
} from "@/components/marketing/precision-luxury/ui/PremiumEditorialPrimitives";
import { AuthorityFaq } from "./AuthorityFaq";
import { AuthorityJsonLd } from "./AuthorityJsonLd";
import { AuthorityRelatedLinks } from "./AuthorityRelatedLinks";
import { AuthoritySection } from "./AuthoritySection";
import { AuthoritySeeAlso } from "./AuthoritySeeAlso";
import { snippetAnswer } from "@/lib/authority/authoritySnippetText";
import { AuthorityQuickAnswer } from "./AuthorityQuickAnswer";
import { AuthorityTopicalCrossLinks } from "./AuthorityTopicalCrossLinks";
import { ContextualProductRecommendations } from "@/components/products/ContextualProductRecommendations";
import { resolveProductRecommendationContextForAntiPatternPage } from "@/lib/products/productRecommendationContext";

function sectionParagraphs(section: AuthorityGuideSection): string[] {
  if (section.paragraphs?.length) return section.paragraphs;
  if (section.body) return [section.body];
  return [];
}

function GuideSectionBody({ section }: { section: AuthorityGuideSection }) {
  const paragraphs = sectionParagraphs(section);
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={`${section.id}-p-${i}`}>{p}</p>
      ))}
      {section.bulletPoints?.length ? (
        <ul className="list-inside list-disc space-y-2 pt-1">
          {section.bulletPoints.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function guideEyebrow(category?: AuthorityGuideCategory): string {
  switch (category) {
    case "anti_pattern":
      return "Anti-pattern guide";
    case "chemical_safety":
      return "Safety guide";
    case "failure_analysis":
      return "Failure analysis guide";
    case "surface_protection":
      return "Surface protection guide";
    case "stain_removal":
      return "Stain removal guide";
    case "foundations":
      return "Foundations guide";
    case "safety":
      return "Safety guide";
    default:
      return "Cleaning guide";
  }
}

function asideImageSrc(slug: string): string {
  const rotation = [
    "/media/trust/oop-walkthrough.jpg",
    "/media/trust/oop-quality-inspection.jpg",
    "/media/services/move-transition.jpg",
  ];
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash + slug.charCodeAt(i) * (i + 1)) % rotation.length;
  return rotation[hash] ?? rotation[0]!;
}

export function AuthorityGuidePage(props: { data: AuthorityGuidePageData }) {
  const { data } = props;
  const crumbs = buildGuideBreadcrumbs(data.slug);
  const seeAlso = buildGuideSeeAlso(data.slug);
  const lead = data.intro ?? data.summary;
  const path = resolveCanonicalMetadataHref(`/guides/${data.slug}`);
  const articleDescription = data.description ?? data.summary;
  const faqBlock = buildGuideFaqBlock(data.slug);
  const quickAnswerText =
    data.category === "anti_pattern"
      ? data.quickAnswer?.trim() || snippetAnswer(data.intro ?? data.summary, 2, 260)
      : "";
  const jsonLd: Record<string, unknown>[] = [
    buildBreadcrumbListSchema(resolveJsonLdBreadcrumbHrefs(crumbs)),
    buildArticleSchema({ title: data.title, description: articleDescription, path }),
  ];
  if (faqBlock?.items.length) jsonLd.push(buildFaqSchema(faqBlock.items));

  const productContext =
    data.category === "anti_pattern" && data.primaryProblemSlug
      ? resolveProductRecommendationContextForAntiPatternPage(data.primaryProblemSlug)
      : null;

  const relatedGuides = getAllGuidePages()
    .filter((g) => g.slug !== data.slug)
    .sort((a, b) => {
      const ac = a.category === data.category ? 0 : 1;
      const bc = b.category === data.category ? 0 : 1;
      return ac - bc || a.title.localeCompare(b.title);
    })
    .slice(0, 5);

  const keyTakeaway =
    quickAnswerText.trim() ||
    snippetAnswer(lead, 2, 280) ||
    snippetAnswer(data.summary ?? data.description ?? "", 2, 280);

  const faqPresent = Boolean(faqBlock?.items.length);

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={jsonLd} />

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-8 md:px-8 md:pt-12">
        <EditorialBreadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Encyclopedia", href: "/encyclopedia" },
            { label: "Guides", href: "/guides" },
            { label: data.title },
          ]}
        />

        <div className="mt-7 grid overflow-hidden rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-5 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-7 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:items-stretch lg:gap-7 lg:p-9">
          <div className="flex min-w-0 flex-col justify-between rounded-[28px] border border-[#E8DFD0]/80 bg-white/76 p-6 sm:p-8">
            <div>
              <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B89F6B]">
                {guideEyebrow(data.category)}
              </p>
              <h1 className="mt-5 font-[var(--font-poppins)] text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.05rem]">
                {data.title}
              </h1>
              <p className="mt-5 max-w-2xl font-[var(--font-manrope)] text-base leading-7 text-[#475569] sm:text-lg sm:leading-8">
                {lead}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 border-t border-[#E8DFD0]/90 pt-6">
              <Link
                href="/guides"
                className={`font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] underline-offset-4 hover:underline ${editorialInteractiveTransition}`}
              >
                Browse all guides
              </Link>
              <span aria-hidden className="text-[#CBD5E1]">
                ·
              </span>
              <Link
                href="/encyclopedia"
                className={`font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] underline-offset-4 hover:underline ${editorialInteractiveTransition}`}
              >
                Search encyclopedia
              </Link>
            </div>
          </div>

          <div className="relative min-w-0">
            <EditorialMediaFrame
              src={asideImageSrc(data.slug)}
              alt="Nu Standard editorial photography paired with educational cleaning guidance."
              aspectClassName="aspect-[16/10] lg:h-full lg:min-h-[460px]"
              frameClassName="rounded-[30px]"
            />
            {keyTakeaway ? (
              <div className="mt-5 rounded-[24px] border border-[#C9B27C]/20 bg-white/92 p-5 shadow-[0_22px_62px_-46px_rgba(15,23,42,0.46)] lg:absolute lg:bottom-5 lg:left-5 lg:right-5 lg:mt-0">
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                  Key takeaway
                </p>
                <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                  {keyTakeaway}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {keyTakeaway ? (
          <div className="mt-8 lg:hidden">
            <div className="rounded-[22px] border border-[#E8DFD0]/95 bg-white/90 p-5">
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                Key takeaway
              </p>
              <p className="mt-3 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">
                {keyTakeaway}
              </p>
            </div>
          </div>
        ) : null}

        {quickAnswerText ? (
          <div className="mt-8">
            <AuthorityQuickAnswer text={quickAnswerText} />
          </div>
        ) : null}

        <AuthorityTopicalCrossLinks pageKey={`guide-${data.slug}`} />

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,720px)_320px] lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="space-y-0">
              {data.sections.map((section) => (
                <AuthoritySection key={section.id} id={section.id} title={section.title}>
                  <GuideSectionBody section={section} />
                </AuthoritySection>
              ))}
            </div>
            {data.linkGroups?.length ? (
              <div className="mt-4 space-y-10">
                {data.linkGroups.map((group, index) => (
                  <AuthoritySection key={group.title} id={`authority-link-${index}`} title={group.title}>
                    <ul className="list-inside list-disc space-y-2">
                      {group.links.map((item) => (
                        <li key={`${item.href}-${item.slug}`}>
                          <Link href={item.href} className="font-medium text-[#0D9488] hover:underline">
                            {item.title}
                          </Link>
                          {item.summary ? <span className="text-[#64748B]"> — {item.summary}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </AuthoritySection>
                ))}
              </div>
            ) : null}
            {data.category === "anti_pattern" ? (
              <ContextualProductRecommendations
                context={productContext}
                trackingContext={
                  productContext
                    ? {
                        pageType: "guide_anti_pattern_page",
                        sourcePageType: productContext.sourcePageType ?? "anti_pattern",
                        problemSlug: data.primaryProblemSlug ?? null,
                        intent: String(productContext.intent),
                      }
                    : undefined
                }
              />
            ) : null}
            <AuthorityRelatedLinks
              beforeProblems={[
                { heading: "Related methods", links: data.relatedMethods },
                { heading: "Related surfaces", links: data.relatedSurfaces },
              ]}
              problemGroups={
                data.relatedProblems?.length ? [{ heading: "Related problems", problems: data.relatedProblems }] : []
              }
            />
            <AuthorityFaq block={faqBlock} id="authority-guide-faq" />
            <AuthoritySeeAlso groups={seeAlso} />

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

            <div className="mt-12 flex flex-wrap gap-4 border-t border-[#E8DFD0]/90 pt-10">
              <MarketingLinkButton href="/book" variant="primary">
                Book a cleaning
              </MarketingLinkButton>
              <MarketingLinkButton href="/services" variant="secondary">
                View services
              </MarketingLinkButton>
            </div>
          </div>

          <aside className="hidden space-y-7 lg:sticky lg:top-28 lg:block">
            {keyTakeaway && !quickAnswerText ? (
              <div className="rounded-[22px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.28)]">
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                  Key takeaway
                </p>
                <p className="mt-3 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">{keyTakeaway}</p>
              </div>
            ) : null}

            <div className="rounded-[22px] border border-[#E8DFD0]/95 bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.28)]">
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                In this guide
              </p>
              <ul className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm text-[#475569]">
                {data.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="font-semibold text-[#0D9488] hover:underline">
                      {section.title}
                    </a>
                  </li>
                ))}
                {data.linkGroups?.map((group, index) => (
                  <li key={group.title}>
                    <a href={`#authority-link-${index}`} className="font-semibold text-[#0D9488] hover:underline">
                      {group.title}
                    </a>
                  </li>
                ))}
                {faqPresent ? (
                  <li>
                    <a href="#authority-guide-faq" className="font-semibold text-[#0D9488] hover:underline">
                      {faqBlock?.title ?? "FAQ"}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>

            {relatedGuides.length > 0 ? (
              <div className="rounded-[22px] border border-[#E8DFD0]/95 bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.28)]">
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                  Related guides
                </p>
                <ul className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm">
                  {relatedGuides.map((guide) => (
                    <li key={guide.slug}>
                      <Link href={`/guides/${guide.slug}`} className="font-semibold text-[#0D9488] hover:underline">
                        {guide.title}
                      </Link>
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
      </main>
      <PublicSiteFooter />
    </div>
  );
}
