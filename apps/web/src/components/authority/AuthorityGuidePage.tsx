import type {
  AuthorityGuideCategory,
  AuthorityGuidePageData,
  AuthorityGuideSection,
} from "@/authority/types/authorityPageTypes";
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
import { AuthorityBreadcrumbs } from "./AuthorityBreadcrumbs";
import { AuthorityFaq } from "./AuthorityFaq";
import { AuthorityHero } from "./AuthorityHero";
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

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={jsonLd} />
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <AuthorityBreadcrumbs items={crumbs} />
        <AuthorityHero eyebrow={guideEyebrow(data.category)} title={data.title} description={lead} />
        {quickAnswerText ? <AuthorityQuickAnswer text={quickAnswerText} /> : null}
        <AuthorityTopicalCrossLinks pageKey={`guide-${data.slug}`} />
        <div className="space-y-0">
          {data.sections.map((section) => (
            <AuthoritySection key={section.id} title={section.title}>
              <GuideSectionBody section={section} />
            </AuthoritySection>
          ))}
        </div>
        {data.linkGroups?.length ? (
          <div className="mt-4 space-y-10">
            {data.linkGroups.map((group) => (
              <AuthoritySection key={group.title} title={group.title}>
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
        <AuthorityFaq block={faqBlock} />
        <AuthoritySeeAlso groups={seeAlso} />
        <div className="mt-14 flex flex-wrap gap-4 border-t border-[#C9B27C]/20 pt-10">
          <MarketingLinkButton href="/book" variant="primary">
            Book a cleaning
          </MarketingLinkButton>
          <MarketingLinkButton href="/services" variant="secondary">
            View services
          </MarketingLinkButton>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
