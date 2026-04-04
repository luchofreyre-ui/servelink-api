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
/** Product “chips” in decision shortcuts call `recordProductClick` + funnel tracking (client component). */
import { AuthorityProblemDecisionShortcuts } from "./AuthorityProblemDecisionShortcuts";
import { AuthorityProblemExploreMore } from "./AuthorityProblemExploreMore";
import { getBuiltBridgeMap } from "@/lib/encyclopedia/bridgeMap";
import { resolveBridgeForLegacyPage } from "@/lib/encyclopedia/bridgeResolver";
import { snippetAnswer } from "@/lib/authority/authoritySnippetText";
import { AuthorityQuickAnswer } from "./AuthorityQuickAnswer";
import { AuthorityProblemQuickFix } from "./AuthorityProblemQuickFix";
import { AuthorityTopicalCrossLinks } from "./AuthorityTopicalCrossLinks";
import { ContextualProductRecommendations } from "@/components/products/ContextualProductRecommendations";
import { AuthorityProblemInlineAssistTracked } from "./AuthorityProblemInlineAssistTracked";
import { AuthorityProblemBestNextMoveClose } from "./AuthorityProblemBestNextMoveClose";
import {
  AuthorityProblemScenarioMethodReinforceLink,
  AuthorityProblemScenarioTopBuyCard,
} from "./AuthorityProblemScenarioPurchaseSurface";
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
import { isExecutionFirstProblemLayout } from "@/lib/authority/authorityProblemExecutionLayout";
import { getOrderedScenarioProducts } from "@/lib/products/bestProductForContext";

const DEFAULT_BEFORE_YOU_CLEAN = `Most people go too aggressive too early.

Most surface buildup here is removable with the right method—but the wrong approach can make things worse or damage the finish.

Start neutral, test first, and only escalate if needed.`;

const railCard =
  "rounded-2xl border border-stone-200/80 bg-white p-4 md:p-6 lg:p-6 space-y-4";

function splitBlocks(text: string) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function parseTopMethodSteps(raw: string): { summary: string; steps: string[] } {
  const blocks = splitBlocks(raw);
  if (!blocks.length) return { summary: "", steps: [] };

  if (blocks.length >= 2) {
    return {
      summary: blocks[0]!,
      steps: blocks.slice(1, 4).map((b) => b.replace(/\s+/g, " ").trim()).slice(0, 3),
    };
  }

  const first = blocks[0]!;
  const sentences = first
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length >= 4) {
    return { summary: sentences[0]!, steps: sentences.slice(1, 4) };
  }
  const lines = first
    .split(/\n/)
    .map((l) => l.replace(/^[-*•]\s*|\d+[.)]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length >= 4) {
    return { summary: lines[0]!, steps: lines.slice(1, 4) };
  }
  return {
    summary: sentences[0] ?? first,
    steps: sentences.length > 1 ? sentences.slice(1, 4) : lines.slice(1, 4),
  };
}

function ProblemBestMethodCard({
  methodParsed,
  className = "",
}: {
  methodParsed: ReturnType<typeof parseTopMethodSteps>;
  className?: string;
}) {
  return (
    <article
      id="problem-methods"
      className={`scroll-mt-28 space-y-4 rounded-2xl border border-stone-200/80 bg-white p-4 md:p-6 ${className}`}
    >
      <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A] md:text-2xl lg:text-3xl">
        Best way to remove it
      </h2>
      {methodParsed.summary ?
        <p className="font-[var(--font-manrope)] text-base leading-[1.3] text-[#475569] md:text-lg">
          {methodParsed.summary}
        </p>
      : null}
      {methodParsed.steps.length > 0 ?
        <ol className="list-inside list-decimal space-y-2 font-[var(--font-manrope)] text-[1.02rem] leading-[1.3] text-[#475569]">
          {methodParsed.steps.map((step, idx) => (
            <li key={idx} className="pl-1">
              {step}
            </li>
          ))}
        </ol>
      : null}
    </article>
  );
}

function buildDiagnosticRows(
  whatItUsuallyIs: string,
  commonOn: string,
): { title: string; body: string }[] {
  const w = splitBlocks(whatItUsuallyIs);
  const c = splitBlocks(commonOn);
  const rows: { title: string; body: string }[] = [];
  if (w[0]) rows.push({ title: "What it is", body: w[0] });
  if (c[0]) rows.push({ title: "Where it shows up", body: c[0] });
  else if (w[1]) rows.push({ title: "More detail", body: w[1] });
  return rows.slice(0, 2);
}

function buildPrecheckBullets(before: string, voice: string[]): string[] {
  const parts = splitBlocks(before);
  const out: string[] = [];
  for (const p of parts) {
    if (out.length >= 2) break;
    const t = p.replace(/\s+/g, " ").trim();
    if (!t) continue;
    out.push(t.length > 240 ? `${t.slice(0, 237)}…` : t);
  }
  let i = 0;
  while (out.length < 2 && voice[i]) {
    out.push(voice[i]!);
    i += 1;
  }
  return out.slice(0, 2);
}

function ProseBlocks({
  text,
  variant = "default",
}: {
  text: string;
  variant?: "default" | "method";
}) {
  const pClass =
    variant === "method"
      ? "text-sm leading-[1.3] md:text-base"
      : "text-sm leading-[1.35] md:text-base";
  const paras = splitBlocks(text).map((para, i) => (
    <p key={i} className={pClass}>
      {para}
    </p>
  ));
  if (variant === "method") {
    return <div className="space-y-2">{paras}</div>;
  }
  return <>{paras}</>;
}

function MutedAside({ children }: { children: ReactNode }) {
  return (
    <div className="border-l border-zinc-200 pl-3 text-sm text-zinc-600 leading-[1.35] [&_p]:leading-[1.35] [&_ul]:mt-2 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-1.5 [&_li]:leading-[1.3]">
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
      <ul className="list-inside list-disc space-y-1.5 leading-[1.3]">
        {lines.map((line) => (
          <li key={line} className="leading-[1.3]">
            {line}
          </li>
        ))}
      </ul>
    );
  }
  return <p className="leading-[1.35]">{text}</p>;
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
  const inlineAssistPurchaseRaw = inlineAssistTopProduct
    ? getProductPurchaseUrl(inlineAssistTopProduct.slug)
    : null;
  const inlineAssistBuyHref =
    inlineAssistPurchaseRaw && inlineAssistPurchaseRaw !== "#" ? inlineAssistPurchaseRaw : null;

  const scenarioWithProducts = data.productScenarios?.find((s) => s.products?.length);
  const roleProductsRaw = scenarioWithProducts?.products?.slice(0, 3) ?? [];
  const roleProducts = getOrderedScenarioProducts(roleProductsRaw, {
    problemSlug: data.slug,
    surface: scenarioWithProducts?.surface ?? null,
  });
  const best = roleProducts[0];
  const heavy = roleProducts[1];
  const maintenance = roleProducts[2];
  const reinforceProduct = best ?? heavy ?? maintenance;
  const reinforceRoleLabel =
    reinforceProduct && best && reinforceProduct.slug === best.slug
      ? "Best overall"
      : reinforceProduct && heavy && reinforceProduct.slug === heavy.slug
        ? "Heavy"
        : "Maintenance";

  const beforeClean = data.beforeYouClean ?? DEFAULT_BEFORE_YOU_CLEAN;
  const voice = data.diagnosticVoiceLines ?? [];
  const methodParsed = parseTopMethodSteps(data.bestMethods);
  const diagnosticRows = buildDiagnosticRows(data.whatItUsuallyIs, data.commonOn);
  const precheckBullets = buildPrecheckBullets(beforeClean, voice);
  const useExecutionLayout = isExecutionFirstProblemLayout(data);

  const anchorNavItems: { href: string; label: string }[] = useExecutionLayout
    ? [
        { href: "#problem-overview", label: "Overview" },
        { href: "#problem-why", label: "Why" },
        { href: "#problem-methods", label: "Methods" },
        { href: "#problem-products", label: "Products" },
        { href: "#problem-faq", label: "FAQ" },
      ]
    : [
        { href: "#problem-overview", label: "Overview" },
        { href: "#problem-context", label: "What it is" },
        { href: "#problem-why", label: "Why" },
        { href: "#problem-methods", label: "Methods" },
        { href: "#problem-products", label: "Products" },
        { href: "#problem-faq", label: "FAQ" },
      ];

  // Education-first; products stay after method + avoid on this template.
  // Shortcuts and topical links are demoted below primary guidance.

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={jsonLd} />
      <main className="mx-auto max-w-6xl scroll-smooth px-4 pb-12 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        {useExecutionLayout ?
          // EXECUTION-FIRST TOP FOLD (see `isExecutionFirstProblemLayout`):
          // Single column only — H1 + definition line + full-width Quick fix + optional “Why this works”.
          // Never add Quick Answer, ProblemBestMethodCard, or the diagnostic “What this usually is” rail here.
          <section className="space-y-4" aria-label="Problem overview">
            <div id="problem-overview" className="scroll-mt-28 space-y-3">
              <AuthorityBreadcrumbs items={crumbs} />
              <nav
                aria-label="On this page"
                className="sticky top-16 z-20 border-b border-zinc-100/90 bg-[#FFF9F3]/90 py-1.5 backdrop-blur-[2px] md:py-2"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-zinc-500 md:gap-x-5 md:text-xs">
                  {anchorNavItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="uppercase tracking-wide text-zinc-500 transition hover:text-zinc-900"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </nav>
              <AuthorityHero
                variant="problemCompact"
                eyebrow="Cleaning problem"
                title={data.title}
                description={data.problemDefinitionLine!}
              />
              <div className="w-full space-y-0" data-testid="execution-first-top-fold">
                <AuthorityProblemQuickFix {...data.executionQuickFix!} />
                {scenarioWithProducts && roleProducts.length > 0 ?
                  <AuthorityProblemScenarioTopBuyCard
                    scenario={scenarioWithProducts}
                    problemSlug={data.slug}
                  />
                : null}
                {data.whyThisWorksShort ?
                  <div
                    id="problem-methods"
                    className="mt-6 scroll-mt-28 text-sm text-zinc-600"
                  >
                    <div className="mb-1 font-semibold">Why this works</div>
                    <div>{data.whyThisWorksShort}</div>
                  </div>
                : null}
                {reinforceProduct ?
                  <AuthorityProblemScenarioMethodReinforceLink
                    productSlug={reinforceProduct.slug}
                    problemSlug={data.slug}
                    roleLabel={reinforceRoleLabel}
                    compareProducts={roleProducts}
                    scenarioSurface={scenarioWithProducts?.surface ?? null}
                  />
                : null}
              </div>
            </div>
          </section>
        : <>
            <section
              data-testid="legacy-problem-top-fold-hero"
              className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)] lg:items-start"
              aria-label="Problem overview"
            >
              <div id="problem-overview" className="space-y-3 scroll-mt-28">
                <AuthorityBreadcrumbs items={crumbs} />
                <nav
                  aria-label="On this page"
                  className="sticky top-16 z-20 border-b border-zinc-200 bg-white/95 py-2 backdrop-blur"
                >
                  <div className="flex flex-wrap items-center gap-5 text-sm text-zinc-600 md:gap-6 md:text-base">
                    {anchorNavItems.map((item) => (
                      <a key={item.href} href={item.href} className="transition hover:text-zinc-900">
                        {item.label}
                      </a>
                    ))}
                  </div>
                </nav>
                <AuthorityHero
                  variant="problemCompact"
                  eyebrow="Cleaning problem"
                  title={data.title}
                  description={data.summary}
                  subline={data.heroSubline}
                />
              </div>
              <div className="lg:pt-10">
                <AuthorityQuickAnswer text={quickAnswerText} variant="problemAnchor" methodsHref="#problem-methods" />
              </div>
            </section>

            <section
              id="problem-top-rail"
              data-testid="legacy-problem-top-fold-rail"
              className="mb-6 mt-4 grid scroll-mt-28 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]"
              aria-label="Primary method and diagnostic context"
            >
              <div className="space-y-4">
                <ProblemBestMethodCard methodParsed={methodParsed} />
                {reinforceProduct ?
                  <AuthorityProblemScenarioMethodReinforceLink
                    productSlug={reinforceProduct.slug}
                    problemSlug={data.slug}
                    roleLabel={reinforceRoleLabel}
                    compareProducts={roleProducts}
                    scenarioSurface={scenarioWithProducts?.surface ?? null}
                  />
                : null}
              </div>

              <aside className="space-y-4">
                <article id="problem-context" className={`${railCard} scroll-mt-28`}>
                  <h2 className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A] md:text-xl">
                    What this usually is
                  </h2>
                  <div className="space-y-4">
                    {diagnosticRows.map((row) => (
                      <div key={row.title} className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold leading-[1.2] text-[#0F172A] md:text-xl">
                            {row.title}
                          </p>
                          <p className="mt-1 text-sm leading-[1.3] text-[#475569] md:text-base">{row.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article id="problem-before-clean" className={`${railCard} scroll-mt-28`}>
                  <h2 className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A] md:text-xl">
                    Before you clean
                  </h2>
                  <ul className="space-y-2">
                    {precheckBullets.map((b) => (
                      <li key={b} className="text-sm leading-[1.3] text-[#475569] md:text-base">
                        {b}
                      </li>
                    ))}
                  </ul>
                </article>
              </aside>
            </section>
          </>
        }

        {useExecutionLayout ?
          <section
            id="problem-top-rail"
            className="mb-6 mt-4 scroll-mt-28"
            aria-label="Before you clean"
          >
            <article id="problem-before-clean" className={`${railCard} scroll-mt-28 max-w-3xl`}>
              <h2 className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A] md:text-xl">
                Before you clean
              </h2>
              <ul className="space-y-2">
                {precheckBullets.map((b) => (
                  <li key={b} className="text-sm leading-[1.3] text-[#475569] md:text-base">
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          </section>
        : null}

        {useExecutionLayout && data.slug === "grease-buildup" ?
          <div id="problem-context" className="scroll-mt-28">
            <AuthoritySection density="compact" title="What this is">
              <ProseBlocks text={data.whatItUsuallyIs} />
            </AuthoritySection>
          </div>
        : null}

        <div id="problem-why" className="scroll-mt-28 space-y-0">
          <AuthoritySection density="compact" title="Why this keeps happening">
            <ProseBlocks text={data.whyItHappens} />
          </AuthoritySection>
        </div>

        <div id="problem-avoid" className="scroll-mt-28">
          <AuthoritySection density="compact" title="What to avoid">
            <MutedAside>
              <AvoidBody text={data.avoidMethods} />
            </MutedAside>
          </AuthoritySection>
        </div>

        <AuthoritySection density="compact" title="Recommended tools">
          <ul className="list-inside list-disc space-y-1.5 text-sm leading-[1.3] text-[#475569] md:text-base">
            {data.recommendedTools.map((t) => (
              <li key={t.name}>
                <span className="font-medium text-[#0F172A]">{t.name}</span>
                {t.note ? <span> — {t.note}</span> : null}
              </li>
            ))}
          </ul>
        </AuthoritySection>

        <AuthoritySection density="compact" title="Recommended chemicals">
          <ul className="list-inside list-disc space-y-1.5 text-sm leading-[1.3] text-[#475569] md:text-base">
            {data.recommendedChemicals.map((c) => (
              <li key={c.name}>
                <span className="font-medium text-[#0F172A]">{c.name}</span>
                {c.note ? <span> — {c.note}</span> : null}
              </li>
            ))}
          </ul>
        </AuthoritySection>

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

        {useExecutionLayout && best ?
          <AuthorityProblemBestNextMoveClose
            problemSlug={data.slug}
            bestProductSlug={best.slug}
            compareProducts={roleProducts}
            scenarioSurface={scenarioWithProducts?.surface ?? null}
          />
        : null}

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

        <AuthorityTopicalCrossLinks
          pageKey={`problem-${data.slug}`}
          problemSlug={data.slug}
          variant="quiet"
        />

        <AuthorityProblemDecisionShortcuts
          data={data}
          heading="Choose a path"
          showProductLinks={false}
          density="compact"
        />

        <div id="problem-edge-notes" className="scroll-mt-28 space-y-0">
          <AuthoritySection density="compact" title="When it's not just buildup">
            <MutedAside>
              <ProseBlocks text={data.whenItFails} />
            </MutedAside>
          </AuthoritySection>

          <AuthoritySection density="compact" title="Common mistakes">
            <MutedAside>
              <ul className="space-y-1.5">
                {data.commonMistakes.map((m) => (
                  <li key={m} className="leading-[1.3]">
                    {m}
                  </li>
                ))}
              </ul>
            </MutedAside>
          </AuthoritySection>

          <AuthoritySection density="compact" title="When to escalate">
            <MutedAside>
              <p className="leading-[1.35]">{data.whenToEscalate}</p>
            </MutedAside>
          </AuthoritySection>
        </div>

        {getMethodSlugsForProblem(data.slug).length > 0 ? (
          <AuthoritySection density="compact" title="Method + problem playbooks">
            <ul className="list-inside list-disc space-y-1.5 text-sm leading-[1.3] md:text-base">
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
          <AuthoritySection density="compact" title="Surface + problem playbooks">
            <ul className="list-inside list-disc space-y-1.5 text-sm leading-[1.3] md:text-base">
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

        <div id="problem-faq" className="scroll-mt-28">
          <AuthorityFaq block={faqBlock} />
        </div>

        {showRelatedNetworkSection ? (
          <section
            id="problem-related-network"
            aria-label="Related problems, comparisons, and clusters"
            className="mt-6 scroll-mt-28 rounded-2xl border border-zinc-200/60 bg-white/50 p-4 sm:p-6"
          >
            <h2 className="mb-4 font-[var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Related & comparisons
            </h2>
            <div className="flex flex-col gap-5">
              {hasRelatedLinkColumn ? (
                <div className="[&>div]:mt-0 [&_section]:mt-5 [&_section:first-of-type]:mt-0">
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
                <AuthoritySection className="!mb-0" density="compact" title="Compare related items">
                  <ul className="list-inside list-disc space-y-1.5 text-sm leading-[1.3] md:text-base">
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
                <AuthoritySection className="!mb-0" density="compact" title="Related clusters">
                  <ul className="list-inside list-disc space-y-1.5 text-sm leading-[1.3] md:text-base">
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

        <AuthoritySection density="compact" title="Product vs product comparisons">
          <p className="font-[var(--font-manrope)] text-sm leading-[1.35] text-[#475569] md:text-base">
            Head-to-head dossier pages use the same picks as recommendations—useful when two bottles look
            interchangeable but sit in different chemistry lanes.
          </p>
          <p className="mt-2">
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
        <div className="mt-8 flex flex-wrap gap-4 border-t border-zinc-200/80 pt-6">
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
