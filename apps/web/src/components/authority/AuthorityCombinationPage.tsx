import type { AuthorityCombinationPageData } from "@/authority/types/authorityCombinationTypes";
import type { AuthoritySeeAlsoGroup } from "@/authority/types/authorityNavigationTypes";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  getSurfaceSlugsForMethod,
  getSurfaceSlugsForProblem,
  methodProblemRelationshipExists,
  methodSurfaceRelationshipExists,
} from "@/authority/data/authorityGraphSelectors";
import {
  buildMethodComboFaqBlock,
  buildSurfaceProblemFaqBlock,
} from "@/authority/data/authorityFaqSelectors";
import {
  buildMethodComboBreadcrumbs,
  buildSurfaceProblemBreadcrumbs,
} from "@/authority/navigation/authorityNavigation";
import {
  buildArticleSchema,
  buildBreadcrumbListSchema,
  buildFaqSchema,
} from "@/authority/metadata/authoritySchema";
import {
  resolveCanonicalMetadataHref,
  resolveJsonLdBreadcrumbHrefs,
} from "@/lib/encyclopedia/encyclopediaCanonicalMetadataHref";
import { preferEncyclopediaCanonicalHref } from "@/lib/encyclopedia/encyclopediaCanonicalHref";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { MarketingLinkButton } from "@/components/marketing/precision-luxury/shared/MarketingLinkButton";
import { AuthorityBreadcrumbs } from "./AuthorityBreadcrumbs";
import { AuthorityCallout } from "./AuthorityCallout";
import { AuthorityFaq } from "./AuthorityFaq";
import { AuthorityHero } from "./AuthorityHero";
import { AuthorityJsonLd } from "./AuthorityJsonLd";
import { AuthoritySection } from "./AuthoritySection";
import { AuthoritySeeAlso } from "./AuthoritySeeAlso";
import RecommendedProductsForTopic from "@/components/products/RecommendedProductsForTopic";
import {
  inferRecommendationIntent,
  inferRecommendationIntentForMethodPlaybook,
} from "@/lib/products/getRecommendedProducts";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";
import { COMMON_CLEANING_MISUSE_BULLETS } from "@/lib/products/commonCleaningMisuse";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import { AuthorityTopicalCrossLinks } from "./AuthorityTopicalCrossLinks";

function cap<T>(items: T[], max = 6): T[] {
  return items.slice(0, max);
}

function buildComboSeeAlso(data: AuthorityCombinationPageData): AuthoritySeeAlsoGroup[] {
  const groups: AuthoritySeeAlsoGroup[] = [];

  const methodLinks = cap(data.relatedMethods)
    .map((slug) => {
      const m = getMethodPageBySlug(slug);
      return m
        ? { title: m.title, href: preferEncyclopediaCanonicalHref(`/methods/${slug}`), description: m.summary }
        : null;
    })
    .filter(Boolean) as AuthoritySeeAlsoGroup["links"];
  if (methodLinks.length) groups.push({ title: "Related methods", links: methodLinks });

  const surfaceLinks = cap(data.relatedSurfaces)
    .map((slug) => {
      const s = getSurfacePageBySlug(slug);
      if (!s) return null;
      let href = `/surfaces/${slug}`;
      if (
        (data.type === "method_surface" || data.type === "method_problem") &&
        data.methodSlug &&
        methodSurfaceRelationshipExists(data.methodSlug, slug)
      ) {
        href = `/methods/${data.methodSlug}/${slug}`;
      }
      return { title: s.title, href, description: s.summary };
    })
    .filter(Boolean) as AuthoritySeeAlsoGroup["links"];
  if (surfaceLinks.length) groups.push({ title: "Related surfaces", links: surfaceLinks });

  const problemLinks = cap(data.relatedProblems)
    .map((slug) => {
      const p = getProblemPageBySlug(slug);
      if (!p) return null;
      let href = preferEncyclopediaCanonicalHref(`/problems/${slug}`);
      if (
        data.type === "method_problem" &&
        data.methodSlug &&
        methodProblemRelationshipExists(data.methodSlug, slug)
      ) {
        href = `/methods/${data.methodSlug}/${slug}`;
      } else if (data.type === "surface_problem" && data.surfaceSlug) {
        href = `/surfaces/${data.surfaceSlug}/${slug}`;
      }
      return { title: p.title, href, description: p.description ?? p.summary };
    })
    .filter(Boolean) as AuthoritySeeAlsoGroup["links"];
  if (problemLinks.length) groups.push({ title: "Related problems", links: problemLinks });

  return groups;
}

function comboBreadcrumbs(data: AuthorityCombinationPageData) {
  if (data.type === "surface_problem" && data.surfaceSlug && data.problemSlug) {
    return buildSurfaceProblemBreadcrumbs(data.surfaceSlug, data.problemSlug);
  }
  if (data.methodSlug) {
    const comboSlug = data.slug.slice(data.methodSlug.length + 1);
    return buildMethodComboBreadcrumbs(data.methodSlug, comboSlug);
  }
  return [];
}

function comboEyebrow(data: AuthorityCombinationPageData): string {
  if (data.type === "method_surface") return "Method + surface playbook";
  if (data.type === "method_problem") return "Method + problem playbook";
  return "Surface + problem playbook";
}

function comboCanonicalPath(data: AuthorityCombinationPageData): string {
  if (data.type === "surface_problem" && data.surfaceSlug && data.problemSlug) {
    return `/surfaces/${data.surfaceSlug}/${data.problemSlug}`;
  }
  if (data.methodSlug) {
    const comboSlug = data.slug.slice(data.methodSlug.length + 1);
    return `/methods/${data.methodSlug}/${comboSlug}`;
  }
  return "/encyclopedia";
}

function comboFaqBlock(data: AuthorityCombinationPageData) {
  if (data.type === "surface_problem" && data.surfaceSlug && data.problemSlug) {
    return buildSurfaceProblemFaqBlock(data.surfaceSlug, data.problemSlug);
  }
  if (data.methodSlug) {
    const comboSlug = data.slug.slice(data.methodSlug.length + 1);
    return buildMethodComboFaqBlock(data.methodSlug, comboSlug);
  }
  return null;
}

function sortedAuthorityStrings(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

/** Shared graph surface for method + problem when the graph lists both. */
function intersectAuthoritySurfaceForMethodProblem(methodSlug: string, problemSlug: string): string | null {
  const methodSurfaces = new Set(getSurfaceSlugsForMethod(methodSlug));
  for (const s of sortedAuthorityStrings(getSurfaceSlugsForProblem(problemSlug))) {
    if (methodSurfaces.has(s)) return s;
  }
  return null;
}

function firstAuthoritySurfaceForProblem(problemSlug: string): string | null {
  const sorted = sortedAuthorityStrings(getSurfaceSlugsForProblem(problemSlug));
  return sorted[0] ?? null;
}

type ComboProductTopicResolved = {
  problem: string;
  surface: string;
  intent: ProductCleaningIntent;
  contextNote?: string;
};

/**
 * Resolves product-library topic for playbooks. There is no separate `method_surface_problem` type;
 * method + surface lives in `method_surface` (no product block—surface without problem) and
 * method + problem lives in `method_problem`.
 */
function comboProductTopic(data: AuthorityCombinationPageData): ComboProductTopicResolved | null {
  if (data.type === "surface_problem" && data.surfaceSlug && data.problemSlug) {
    const problem = productProblemStringForAuthorityProblemSlug(data.problemSlug);
    const surface = productSurfaceStringForAuthoritySurfaceSlug(data.surfaceSlug);
    if (!problem || !surface) return null;
    return { problem, surface, intent: inferRecommendationIntent(problem) };
  }

  if (data.type === "method_problem" && data.methodSlug && data.problemSlug) {
    const problem = productProblemStringForAuthorityProblemSlug(data.problemSlug);
    if (!problem) return null;

    const matchedAuth = intersectAuthoritySurfaceForMethodProblem(data.methodSlug, data.problemSlug);
    const fallbackAuth = matchedAuth ?? firstAuthoritySurfaceForProblem(data.problemSlug);
    const surfaceProduct = fallbackAuth ? productSurfaceStringForAuthoritySurfaceSlug(fallbackAuth) : null;
    const surface = surfaceProduct ?? "tile";

    let contextNote: string | undefined;
    if (!surfaceProduct) {
      contextNote =
        "No authority surface is linked to this problem in the graph yet—rankings use tile as a broad library stand-in. Always verify the label against your material.";
    } else if (!matchedAuth) {
      contextNote = `This method + problem pair is not pinned to one surface in the graph—rankings use ${surface} as a representative surface from the problem’s links.`;
    }

    return {
      problem,
      surface,
      intent: inferRecommendationIntentForMethodPlaybook(data.methodSlug, problem),
      contextNote,
    };
  }

  if (data.type === "method_surface") {
    return null;
  }

  return null;
}

export function AuthorityCombinationPage(props: { data: AuthorityCombinationPageData }) {
  const { data } = props;
  const crumbs = comboBreadcrumbs(data);
  const seeAlso = buildComboSeeAlso(data);
  const path = resolveCanonicalMetadataHref(comboCanonicalPath(data));
  const faqBlock = comboFaqBlock(data);
  const productTopic = comboProductTopic(data);
  const jsonLd: Record<string, unknown>[] = [
    buildBreadcrumbListSchema(resolveJsonLdBreadcrumbHrefs(crumbs)),
    buildArticleSchema({ title: data.title, description: data.description, path }),
  ];
  if (faqBlock?.items.length) jsonLd.push(buildFaqSchema(faqBlock.items));

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={jsonLd} />
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <AuthorityBreadcrumbs items={crumbs} />
        <AuthorityHero eyebrow={comboEyebrow(data)} title={data.title} description={data.description} />
        <AuthorityTopicalCrossLinks pageKey={`combo-${data.slug}`} problemSlug={data.problemSlug} />
        <AuthoritySection title="Overview">
          <p>{data.overview}</p>
        </AuthoritySection>
        <AuthoritySection title="Why this pairing">
          <p>{data.whyItWorks}</p>
        </AuthoritySection>
        <AuthoritySection title="Risks">
          <AuthorityCallout variant="warning">{data.risks}</AuthorityCallout>
        </AuthoritySection>
        <AuthoritySection title="Process">
          <ol className="list-inside list-decimal space-y-2">
            {data.process.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </AuthoritySection>

        <div className="mt-8 rounded-lg border border-neutral-200 bg-gray-50 p-4">
          <h3 className="mb-3 font-semibold text-[#0F172A]">Best approach by severity</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>Light:</strong> Use a mild cleaner and wipe method
            </li>
            <li>
              <strong>Moderate:</strong> Use targeted chemistry with dwell time
            </li>
            <li>
              <strong>Heavy:</strong> Use restoration-level cleaning and repeat cycles
            </li>
          </ul>
        </div>

        {productTopic ? (
          <div className="mt-10">
            <RecommendedProductsForTopic
              problem={productTopic.problem}
              surface={productTopic.surface}
              intent={productTopic.intent}
              contextNote={productTopic.contextNote}
              showScores
              showReasons
              showComparisons
            />
          </div>
        ) : null}

        <AuthoritySection title="Common mistakes">
          <div className="space-y-2">
            {COMMON_CLEANING_MISUSE_BULLETS.slice(0, 3).map((m) => (
              <AuthorityCallout key={m} variant="mistake">
                {m}
              </AuthorityCallout>
            ))}
          </div>
        </AuthoritySection>

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
