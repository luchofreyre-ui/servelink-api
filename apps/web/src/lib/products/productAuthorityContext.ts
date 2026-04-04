import { getAllProblemPages } from "@/authority/data/authorityProblemPageData";
import type {
  AuthorityProblemExecutionQuickFix,
  AuthorityProblemPageData,
} from "@/authority/types/authorityPageTypes";
import { buildCompareProductsHref } from "@/lib/products/compareSlugBuilder";
import { hasComparePage } from "@/lib/products/compareAvailability";

export type ProblemUseChip = {
  slug: string;
  title: string;
  href: string;
};

export type ProductAuthorityContext = {
  problemContext: string | null;
  comparisonSlug: string | null;
  problemUseChips: ProblemUseChip[];
};

function firstSentence(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^.*?[.!?](\s|$)/);
  const sentence = match ? match[0].trim() : trimmed;
  return sentence.length > 180 ? `${sentence.slice(0, 177).trim()}...` : sentence;
}

function executionQuickFixToText(q?: AuthorityProblemExecutionQuickFix | null): string | null {
  if (!q) return null;
  return [q.use, q.do, q.ifNeeded].filter(Boolean).join(" ");
}

function buildProblemContextFromPage(page: {
  title: string;
  executionQuickFix?: AuthorityProblemExecutionQuickFix;
  whyThisWorksShort?: string;
}): string | null {
  const why = firstSentence(page.whyThisWorksShort);
  if (why) return why;

  const quickFix = firstSentence(executionQuickFixToText(page.executionQuickFix ?? null));
  if (quickFix) return `${page.title}: ${quickFix}`;

  return `Used when dealing with ${page.title.toLowerCase()}.`;
}

const COMPARISON_PAIR_MARKER = "-vs-";

/** Other product slug in the primary comparison pair for this catalog SKU, if any. */
export function getComparisonOpponentSlug(productSlug: string): string | null {
  const { comparisonSlug } = getProductAuthorityContext(productSlug);
  if (!comparisonSlug) return null;
  const i = comparisonSlug.indexOf(COMPARISON_PAIR_MARKER);
  if (i === -1) return null;
  const left = comparisonSlug.slice(0, i);
  const right = comparisonSlug.slice(i + COMPARISON_PAIR_MARKER.length);
  if (left === productSlug) return right;
  if (right === productSlug) return left;
  return null;
}

export function getProductAuthorityContext(productSlug: string): ProductAuthorityContext {
  const problemPages = getAllProblemPages();

  const matchedPages: Array<{
    page: AuthorityProblemPageData;
    scenario: NonNullable<AuthorityProblemPageData["productScenarios"]>[number];
    productIndex: number;
    compareHref: string | null;
    problemContext: string | null;
  }> = [];

  for (const page of problemPages) {
    const scenario = page.productScenarios?.find((row) =>
      (row.products ?? []).some((product) => product.slug === productSlug),
    );

    if (!scenario) continue;

    const products = scenario.products ?? [];
    const productIndex = products.findIndex((product) => product.slug === productSlug);
    const comparePair = products.slice(0, 2);
    const compareHref =
      comparePair.length >= 2 && hasComparePage(comparePair) ? buildCompareProductsHref(comparePair) : null;

    matchedPages.push({
      page,
      scenario,
      productIndex,
      compareHref,
      problemContext: buildProblemContextFromPage({
        title: page.title,
        executionQuickFix: page.executionQuickFix,
        whyThisWorksShort: page.whyThisWorksShort,
      }),
    });
  }

  const sorted = matchedPages.sort((a, b) => {
    if (a.productIndex !== b.productIndex) return a.productIndex - b.productIndex;
    return a.page.title.localeCompare(b.page.title);
  });

  const primary = sorted[0] ?? null;

  const comparisonSlug = primary?.compareHref ? primary.compareHref.replace("/compare/products/", "") : null;

  const problemUseChips = sorted.slice(0, 6).map(({ page }) => ({
    slug: page.slug,
    title: page.title,
    href: `/problems/${page.slug}`,
  }));

  return {
    problemContext: primary?.problemContext ?? null,
    comparisonSlug,
    problemUseChips,
  };
}
