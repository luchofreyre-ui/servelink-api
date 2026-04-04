import { getAllProblemPages } from "@/authority/data/authorityProblemPageData";
import type {
  AuthorityProblemExecutionQuickFix,
  AuthorityProblemPageData,
} from "@/authority/types/authorityPageTypes";
import { buildCompareProductsHref } from "@/lib/products/compareSlugBuilder";
import { hasComparePage } from "@/lib/products/compareAvailability";
import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";

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
/** Hubs where execution-first + stacked monetization is editorially prioritized. */
const STACKABLE_EXECUTION_FIRST_PRODUCT_PROBLEM_SLUGS = new Set([
  "dust-buildup",
  "surface-haze",
  "product-residue-buildup",
  "grease-buildup",
  "hard-water-deposits",
  "mold-growth",
  "light-mildew",
  "streaking-on-glass",
  "cloudy-glass",
  "smudge-marks",
  "odor-retention",
  "limescale-buildup",
]);

function scoreMatchedProblem(args: {
  page: AuthorityProblemPageData;
  productIndex: number;
  compareHref: string | null;
  bestProductSlug: string | null;
}): number {
  let score = 0;

  if (args.productIndex === 0) score += 100;
  else if (args.productIndex === 1) score += 60;
  else if (args.productIndex === 2) score += 30;

  if (args.page.executionQuickFix && args.page.problemDefinitionLine) score += 40;
  if (args.compareHref) score += 20;
  if (args.bestProductSlug && getProductPurchaseUrl(args.bestProductSlug) !== "#") score += 10;
  if (STACKABLE_EXECUTION_FIRST_PRODUCT_PROBLEM_SLUGS.has(args.page.slug)) score += 10;

  return score;
}

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
    score: number;
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
    const bestProductSlug = products[0]?.slug ?? null;

    const score = scoreMatchedProblem({
      page,
      productIndex,
      compareHref,
      bestProductSlug,
    });

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
      score,
    });
  }

  const sorted = matchedPages.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
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
