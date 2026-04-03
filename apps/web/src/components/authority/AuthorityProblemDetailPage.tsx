import type { ReactNode } from "react";
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
import { AuthorityProblemInlineAssistTracked } from "./AuthorityProblemInlineAssistTracked";
import type { InlineAssistProduct } from "@/components/products/InlineProductAssist";
import { getProductImageUrl } from "@/lib/products/getProductImageUrl";
import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";
import { getPublishedProductBySlug } from "@/lib/products/productPublishing";
import {
  getRecommendedProductsForDisplay,
} from "@/lib/products/productRecommendationDensity";
import {
  assignRecommendationRoleLabels,
} from "@/lib/products/recommendationRoles";
import type { PublishedProductLike } from "@/lib/products/getRecommendedProducts";
import { resolveProductRecommendationContextForProblemPage } from "@/lib/products/productRecommendationContext";

const DEFAULT_BEFORE_YOU_CLEAN = `Most people go too aggressive too early.

Most surface buildup here is removable with the right method—but the wrong approach can make things worse or damage the finish.

Start neutral, test first, and only escalate if needed.`;

function splitBlocks(text: string) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function ProseBlocks({ text }: { text: string }) {
  return (
    <>
      {splitBlocks(text).map((para, i) => (
        <p key={i} className="text-sm leading-relaxed md:text-base">
          {para}
        </p>
      ))}
    </>
  );
}

function MutedAside({ children }: { children: ReactNode }) {
  return (
    <div className="border-l border-zinc-200 pl-3 text-sm text-zinc-600 [&_ul]:mt-2 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-1.5">
      {children}
    </div>
  );
}

function buildProblemInlineAssistPick(
  like: PublishedProductLike | null | undefined,
): InlineAssistProduct | null {
  if (!like) return null;
  const published = getPublishedProductBySlug(like.slug);
  const name = (published?.title ?? like.title ?? like.slug).trim();
  const image = getProductImageUrl(published ?? like);
  if (!image) return null;
  return { slug: like.slug, name, image };
}

function AvoidBody({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 1) {
    return (
      <ul className="list-inside list-disc space-y-2">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    );
  }
  return <p>{text}</p>;
}

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
  const hasRelatedLinkColumn =
    data.relatedProblems.length > 0 ||
    data.relatedMethods.length > 0 ||
    data.relatedSurfaces.length > 0;
  const showRelatedNetworkSection =
    hasRelatedLinkColumn || compareSlugs.length > 0 || relatedClusterSlugs.length > 0;
  const quickAnswerText =
    data.quickAnswer?.trim() || snippetAnswer(data.whatItUsuallyIs, 2, 260);
  const productContext = resolveProductRecommendationContextForProblemPage(data.slug);
  const recommendationContext = productContext;

  const DEFAULT_REC_SURFACE = "tile";
  let recommendationProducts: readonly PublishedProductLike[] | null = null;
  if (productContext) {
    const surface = productContext.surface ?? DEFAULT_REC_SURFACE;
    const products = getRecommendedProductsForDisplay({
      problem: productContext.problem,
      surface,
      intent: productContext.intent,
      densityAuthorityProblemSlug: productContext.densityAuthorityProblemSlug,
    });
    const labels = assignRecommendationRoleLabels(products, surface);
    const priorityOrderRaw = [
      labels.bestOverall,
      labels.bestForHeavy,
      labels.bestForMaintenance,
      labels.professional,
    ].filter((slug): slug is string => Boolean(slug));
    const priorityOrder = [...new Set(priorityOrderRaw)];
    recommendationProducts = [
      ...priorityOrder
        .map((slug) => products.find((p) => p.slug === slug))
        .filter((p): p is PublishedProductLike => p != null),
      ...products.filter((p) => !priorityOrder.includes(p.slug)),
    ];
  }

  const inlineAssistTopProduct = recommendationProducts?.[0] ?? null;

  const inlineAssistTopPick = buildProblemInlineAssistPick(inlineAssistTopProduct);
  const inlineAssistSecondaryPick = buildProblemInlineAssistPick(recommendationProducts?.[1] ?? null);
  const inlineAssistBuyHref = inlineAssistTopProduct
    ? getProductPurchaseUrl(getPublishedProductBySlug(inlineAssistTopProduct.slug) ?? inlineAssistTopProduct)
    : null;

  const beforeClean = data.beforeYouClean ?? DEFAULT_BEFORE_YOU_CLEAN;
  const voice = data.diagnosticVoiceLines ?? [];

  // SYSTEM RULE:
  // This page is education-first.
  // Products assist decisions — they do not drive them.
  // Flow: explain what/why before advisory (before you clean, diagnostics).
  // Inline assist and hub recommendations stay after method + avoid — never above that core.

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={jsonLd} />
      <main className="mx-auto max-w-6xl scroll-smooth px-4 pb-12 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <div className="mb-3">
          <AuthorityBreadcrumbs items={crumbs} />
        </div>

        <nav
          aria-label="On this page"
          className="sticky top-16 z-20 mb-4 border-b border-zinc-200 bg-white/95 pb-3 backdrop-blur"
        >
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
            <a href="#problem-overview" className="transition hover:text-zinc-900">
              Overview
            </a>
            <a href="#problem-context" className="transition hover:text-zinc-900">
              What it is
            </a>
            <a href="#problem-why" className="transition hover:text-zinc-900">
              Why
            </a>
            <a href="#problem-before-clean" className="transition hover:text-zinc-900">
              Before you clean
            </a>
            <a href="#problem-methods" className="transition hover:text-zinc-900">
              Methods
            </a>
            <a href="#problem-products" className="transition hover:text-zinc-900">
              Products
            </a>
            <a href="#problem-faq" className="transition hover:text-zinc-900">
              FAQ
            </a>
          </div>
        </nav>

        <div id="problem-overview" className="mb-8 scroll-mt-28">
          <AuthorityHero
            eyebrow="Cleaning problem"
            title={data.title}
            description={data.summary}
            subline={data.heroSubline}
          />
          <AuthorityQuickAnswer text={quickAnswerText} />
          <AuthorityTopicalCrossLinks pageKey={`problem-${data.slug}`} problemSlug={data.slug} />
        </div>

        <div id="problem-context" className="scroll-mt-28 space-y-0">
          <AuthoritySection title="What this usually is">
            <ProseBlocks text={data.whatItUsuallyIs} />
          </AuthoritySection>
        </div>

        <div id="problem-why" className="scroll-mt-28 space-y-0">
          <AuthoritySection title="Why this keeps happening">
            <ProseBlocks text={data.whyItHappens} />
          </AuthoritySection>
          <AuthoritySection title="Where you'll see it most">
            <ProseBlocks text={data.commonOn} />
          </AuthoritySection>
        </div>

        <div id="problem-before-clean" className="scroll-mt-28 space-y-0">
          <AuthoritySection title="Before you start cleaning">
            <ProseBlocks text={beforeClean} />
          </AuthoritySection>
          {voice.length > 0 ? (
            <AuthoritySection title="Diagnostic signals">
              <MutedAside>
                <ul>
                  {voice.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </MutedAside>
            </AuthoritySection>
          ) : null}
          <div id="problem-shortcuts" className="scroll-mt-28">
            <AuthorityProblemDecisionShortcuts data={data} />
          </div>
        </div>

        <div id="problem-methods" className="scroll-mt-28 space-y-0">
          <AuthoritySection title="Best way to remove it">
            <ProseBlocks text={data.bestMethods} />
          </AuthoritySection>

          <AuthoritySection title="Recommended tools">
            <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-[#475569] md:text-base">
              {data.recommendedTools.map((t) => (
                <li key={t.name}>
                  <span className="font-medium text-[#0F172A]">{t.name}</span>
                  {t.note ? <span> — {t.note}</span> : null}
                </li>
              ))}
            </ul>
          </AuthoritySection>

          <AuthoritySection title="Recommended chemicals">
            <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-[#475569] md:text-base">
              {data.recommendedChemicals.map((c) => (
                <li key={c.name}>
                  <span className="font-medium text-[#0F172A]">{c.name}</span>
                  {c.note ? <span> — {c.note}</span> : null}
                </li>
              ))}
            </ul>
          </AuthoritySection>

          <AuthoritySection title="What to avoid">
            <MutedAside>
              <AvoidBody text={data.avoidMethods} />
            </MutedAside>
          </AuthoritySection>
        </div>

        {recommendationContext ? (
          <AuthorityProblemInlineAssistTracked
            topPick={inlineAssistTopPick}
            secondaryPick={inlineAssistSecondaryPick}
            buyHref={inlineAssistBuyHref}
            problemSlug={data.slug}
            intent={
              recommendationContext?.intent != null
                ? String(recommendationContext.intent)
                : null
            }
          />
        ) : null}

        {getMethodSlugsForProblem(data.slug).length > 0 ? (
          <AuthoritySection title="Method + problem playbooks">
            <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed md:text-base">
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
            <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed md:text-base">
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

        <div id="problem-products" className="scroll-mt-28">
          <ContextualProductRecommendations
            context={productContext}
            presentation="problemHubSupporting"
            trackingContext={{
              pageType: "problem_page",
              sourcePageType: productContext?.sourcePageType ?? "problem",
              problemSlug: data.slug,
              intent: productContext?.intent != null ? String(productContext.intent) : null,
            }}
          />
        </div>

        <div id="problem-edge-notes" className="scroll-mt-28 space-y-0">
          <AuthoritySection title="When it's not just buildup">
            <MutedAside>
              <ProseBlocks text={data.whenItFails} />
            </MutedAside>
          </AuthoritySection>

          <AuthoritySection title="Common mistakes">
            <MutedAside>
              <ul>
                {data.commonMistakes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </MutedAside>
          </AuthoritySection>

          <AuthoritySection title="When to escalate">
            <MutedAside>
              <p>{data.whenToEscalate}</p>
            </MutedAside>
          </AuthoritySection>
        </div>

        <div id="problem-faq" className="scroll-mt-28">
          <AuthorityFaq block={faqBlock} />
        </div>

        {showRelatedNetworkSection ? (
          <section
            id="problem-related-network"
            aria-label="Related problems, comparisons, and clusters"
            className="mt-8 scroll-mt-28 rounded-2xl border border-zinc-200/60 bg-white/50 p-5 sm:p-7"
          >
            <h2 className="mb-5 font-[var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Related & comparisons
            </h2>
            <div className="flex flex-col gap-6">
              {hasRelatedLinkColumn ? (
                <div className="[&>div]:mt-0 [&_section]:mt-6 [&_section:first-of-type]:mt-0">
                  <AuthorityRelatedLinks
                    problemGroups={[{ heading: "Related problems", problems: data.relatedProblems }]}
                    afterProblems={[
                      { heading: "Related methods", links: data.relatedMethods },
                      { heading: "Related surfaces", links: data.relatedSurfaces },
                    ]}
                  />
                </div>
              ) : null}
              {compareSlugs.length ? (
                <AuthoritySection className="!mb-0" title="Compare related items">
                  <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed md:text-base">
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
                <AuthoritySection className="!mb-0" title="Related clusters">
                  <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed md:text-base">
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
            </div>
          </section>
        ) : null}

        <AuthorityProblemBestBySurface problemSlug={data.slug} data={data} />

        <AuthorityProblemProductHub data={data} />

        <AuthoritySection title="Product vs product comparisons">
          <p className="font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569] md:text-base">
            Head-to-head dossier pages use the same picks as recommendations—useful when two bottles look
            interchangeable but sit in different chemistry lanes.
          </p>
          <p className="mt-3">
            <Link href="/compare/products" className="font-medium text-[#0D9488] hover:underline">
              Browse product comparisons →
            </Link>
          </p>
        </AuthoritySection>

        <AuthorityProblemExploreMore problemSlug={data.slug} data={data} />

        <AuthoritySeeAlso groups={seeAlso} />
        {encyclopediaBridge ?
          <AuthorityToEncyclopediaBridge
            href={encyclopediaBridge.href}
            title="Learn the full breakdown"
          />
        : null}
        <div className="mt-10 flex flex-wrap gap-4 border-t border-zinc-200/80 pt-8">
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
