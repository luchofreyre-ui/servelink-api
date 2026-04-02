import type { AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";
import {
  formatComparisonLinkLabel,
  getComparisonSlugsForEntity,
} from "@/authority/data/authorityComparisonSelectors";
import {
  getClusterTitleBySlug,
  getRelatedClusterSlugsForProblemCategory,
} from "@/authority/data/authorityClusterSelectors";
import { buildProblemFaqBlock } from "@/authority/data/authorityFaqSelectors";
import { getMethodSlugsForProblem, getSurfaceSlugsForProblem } from "@/authority/data/authorityGraphSelectors";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  buildProblemBreadcrumbs,
  buildProblemSeeAlso,
} from "@/authority/navigation/authorityNavigation";
import {
  buildBreadcrumbListSchema,
  buildDefinedTermSchema,
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
import { AuthorityCallout } from "./AuthorityCallout";
import { AuthorityFaq } from "./AuthorityFaq";
import { AuthorityHero } from "./AuthorityHero";
import { AuthorityJsonLd } from "./AuthorityJsonLd";
import { AuthorityRelatedLinks } from "./AuthorityRelatedLinks";
import { AuthoritySection } from "./AuthoritySection";
import { AuthoritySeeAlso } from "./AuthoritySeeAlso";
import { AuthorityToEncyclopediaBridge } from "./AuthorityToEncyclopediaBridge";
import { AuthorityProblemProductHub } from "./AuthorityProblemProductHub";
import { AuthorityProblemBestBySurface } from "./AuthorityProblemBestBySurface";
import { AuthorityProblemDecisionShortcuts } from "./AuthorityProblemDecisionShortcuts";
import { AuthorityProblemExploreMore } from "./AuthorityProblemExploreMore";
import { getBuiltBridgeMap } from "@/lib/encyclopedia/bridgeMap";
import { resolveBridgeForLegacyPage } from "@/lib/encyclopedia/bridgeResolver";
import { snippetAnswer } from "@/lib/authority/authoritySnippetText";
import { AuthorityQuickAnswer } from "./AuthorityQuickAnswer";
import { AuthorityTopicalCrossLinks } from "./AuthorityTopicalCrossLinks";
import { ContextualProductRecommendations } from "@/components/products/ContextualProductRecommendations";
import { resolveProductRecommendationContextForProblemPage } from "@/lib/products/productRecommendationContext";

export function AuthorityProblemDetailPage(props: { data: AuthorityProblemPageData }) {
  const { data } = props;
  const bridgeMap = getBuiltBridgeMap();
  const encyclopediaBridge = resolveBridgeForLegacyPage(
    "problems",
    data.slug,
    bridgeMap,
  );
  const crumbs = buildProblemBreadcrumbs(data.slug);
  const seeAlso = buildProblemSeeAlso(data.slug);
  const path = resolveCanonicalMetadataHref(`/problems/${data.slug}`);
  const faqBlock = buildProblemFaqBlock(data.slug);
  const jsonLd: Record<string, unknown>[] = [
    buildBreadcrumbListSchema(resolveJsonLdBreadcrumbHrefs(crumbs)),
    buildDefinedTermSchema({ name: data.title, description: data.summary, path }),
  ];
  if (faqBlock?.items.length) jsonLd.push(buildFaqSchema(faqBlock.items));

  const compareSlugs = getComparisonSlugsForEntity("problem_comparison", data.slug).slice(0, 4);
  const relatedClusterSlugs = getRelatedClusterSlugsForProblemCategory(data.category);
  const quickAnswerText =
    data.quickAnswer?.trim() || snippetAnswer(data.whatItUsuallyIs, 2, 260);
  const productContext = resolveProductRecommendationContextForProblemPage(data.slug);

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={jsonLd} />
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <AuthorityBreadcrumbs items={crumbs} />
        <AuthorityHero eyebrow="Cleaning problem" title={data.title} description={data.summary} />
        <AuthorityQuickAnswer text={quickAnswerText} />
        <AuthorityTopicalCrossLinks pageKey={`problem-${data.slug}`} problemSlug={data.slug} />
        <div className="mt-8">
          <AuthorityProblemDecisionShortcuts data={data} />
        </div>
        <AuthoritySection title="What it usually is">
          <p>{data.whatItUsuallyIs}</p>
        </AuthoritySection>
        <AuthoritySection title="Why it happens">
          <p>{data.whyItHappens}</p>
        </AuthoritySection>
        <AuthoritySection title="Common on">
          <p>{data.commonOn}</p>
        </AuthoritySection>
        <AuthoritySection title="Best methods">
          <p>{data.bestMethods}</p>
        </AuthoritySection>
        <AuthoritySection title="Avoid">
          <AuthorityCallout variant="warning">{data.avoidMethods}</AuthorityCallout>
        </AuthoritySection>
        <AuthoritySection title="Recommended tools">
          <ul className="list-inside list-disc space-y-1">
            {data.recommendedTools.map((t) => (
              <li key={t.name}>
                <span className="font-medium text-[#0F172A]">{t.name}</span>
                {t.note ? <span> — {t.note}</span> : null}
              </li>
            ))}
          </ul>
        </AuthoritySection>
        <AuthoritySection title="Recommended chemicals">
          <ul className="list-inside list-disc space-y-1">
            {data.recommendedChemicals.map((c) => (
              <li key={c.name}>
                <span className="font-medium text-[#0F172A]">{c.name}</span>
                {c.note ? <span> — {c.note}</span> : null}
              </li>
            ))}
          </ul>
        </AuthoritySection>
        <ContextualProductRecommendations context={productContext} />
        <AuthoritySection title="Common mistakes">
          <div className="space-y-2">
            {data.commonMistakes.map((m) => (
              <AuthorityCallout key={m} variant="mistake">
                {m}
              </AuthorityCallout>
            ))}
          </div>
        </AuthoritySection>
        <AuthoritySection title="When it fails">
          <AuthorityCallout variant="failure">{data.whenItFails}</AuthorityCallout>
        </AuthoritySection>
        <AuthoritySection title="When to escalate">
          <AuthorityCallout variant="escalate">{data.whenToEscalate}</AuthorityCallout>
        </AuthoritySection>
        {getMethodSlugsForProblem(data.slug).length > 0 ? (
          <AuthoritySection title="Method + problem playbooks">
            <ul className="list-inside list-disc space-y-2">
              {getMethodSlugsForProblem(data.slug).map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/methods/${slug}/${data.slug}`}
                    className="font-medium text-[#0D9488] hover:underline"
                  >
                    {getMethodPageBySlug(slug)?.title ?? slug} + {data.title.toLowerCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </AuthoritySection>
        ) : null}
        {getSurfaceSlugsForProblem(data.slug).length > 0 ? (
          <AuthoritySection title="Surface + problem playbooks">
            <ul className="list-inside list-disc space-y-2">
              {getSurfaceSlugsForProblem(data.slug).map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/surfaces/${slug}/${data.slug}`}
                    className="font-medium text-[#0D9488] hover:underline"
                  >
                    {getSurfacePageBySlug(slug)?.title ?? slug} + {data.title.toLowerCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </AuthoritySection>
        ) : null}
        <AuthorityRelatedLinks
          problemGroups={[{ heading: "Related problems", problems: data.relatedProblems }]}
          afterProblems={[
            { heading: "Related methods", links: data.relatedMethods },
            { heading: "Related surfaces", links: data.relatedSurfaces },
          ]}
        />
        {compareSlugs.length ? (
          <AuthoritySection title="Compare related items">
            <ul className="list-inside list-disc space-y-2">
              {compareSlugs.map((comparisonSlug) => (
                <li key={comparisonSlug}>
                  <Link
                    href={`/compare/problems/${comparisonSlug}`}
                    className="font-medium text-[#0D9488] hover:underline"
                  >
                    {formatComparisonLinkLabel("problem_comparison", comparisonSlug)}
                  </Link>
                </li>
              ))}
            </ul>
          </AuthoritySection>
        ) : null}
        {relatedClusterSlugs.length ? (
          <AuthoritySection title="Related clusters">
            <ul className="list-inside list-disc space-y-2">
              {relatedClusterSlugs.map((clusterSlug) => (
                <li key={clusterSlug}>
                  <Link
                    href={`/clusters/${clusterSlug}`}
                    className="font-medium text-[#0D9488] hover:underline"
                  >
                    {getClusterTitleBySlug(clusterSlug)}
                  </Link>
                </li>
              ))}
            </ul>
          </AuthoritySection>
        ) : null}

        <AuthorityProblemBestBySurface problemSlug={data.slug} data={data} />

        <AuthorityProblemProductHub data={data} />

        <AuthoritySection title="Product vs product comparisons">
          <p className="font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">
            Head-to-head dossier pages (same decision system as recommendations) live in the product comparison
            hub—useful when two bottles look interchangeable but sit in different chemistry lanes.
          </p>
          <p className="mt-3">
            <Link href="/compare/products" className="font-medium text-[#0D9488] hover:underline">
              Browse product comparisons →
            </Link>
          </p>
        </AuthoritySection>

        <AuthorityProblemExploreMore problemSlug={data.slug} data={data} />

        <AuthorityFaq block={faqBlock} />
        <AuthoritySeeAlso groups={seeAlso} />
        {encyclopediaBridge ?
          <AuthorityToEncyclopediaBridge
            href={encyclopediaBridge.href}
            title="Learn the full breakdown"
          />
        : null}
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
