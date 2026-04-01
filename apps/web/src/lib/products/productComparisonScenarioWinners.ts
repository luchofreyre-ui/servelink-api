import { getSurfaceProblemEdges } from "@/authority/data/authorityGraphSelectors";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import { getRecommendedProducts, inferRecommendationIntent } from "@/lib/products/getRecommendedProducts";
import { getPublishedProductBySlug } from "@/lib/products/productPublishing";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

export type ComparisonScenarioWinner = {
  scenarioLabel: string;
  playbookHref: string;
  winnerSlug: string;
  winnerName: string;
  runnerUp?: string;
  note?: string;
};

/**
 * Scenarios where both SKUs list the problem + surface; winner is whoever leads `getRecommendedProducts`.
 */
export function buildProductComparisonScenarioWinners(
  leftSlug: string,
  rightSlug: string,
  options: { maxRows?: number } = {},
): ComparisonScenarioWinner[] {
  const maxRows = options.maxRows ?? 8;
  const left = getPublishedProductBySlug(leftSlug);
  const right = getPublishedProductBySlug(rightSlug);
  if (!left || !right) return [];

  const sharedProblems = left.compatibleProblems.filter((p) => right.compatibleProblems.includes(p));
  const sharedSurfaces = left.compatibleSurfaces.filter((s) => right.compatibleSurfaces.includes(s));
  if (!sharedProblems.length || !sharedSurfaces.length) return [];

  const sharedProblemSet = new Set(sharedProblems);
  const sharedSurfaceSet = new Set(sharedSurfaces.map((s) => s.toLowerCase()));

  const rows: ComparisonScenarioWinner[] = [];

  for (const edge of getSurfaceProblemEdges()) {
    const pStr = productProblemStringForAuthorityProblemSlug(edge.problemSlug);
    const sStr = productSurfaceStringForAuthoritySurfaceSlug(edge.surfaceSlug);
    if (!pStr || !sStr) continue;
    if (!sharedProblemSet.has(pStr)) continue;
    if (!sharedSurfaceSet.has(sStr.toLowerCase())) continue;

    const intent = inferRecommendationIntent(pStr) as ProductCleaningIntent;
    const ranked = getRecommendedProducts({ problem: pStr, surface: sStr, limit: 5, intent });
    const winner = ranked[0];
    if (!winner) continue;

    const lix = ranked.findIndex((p) => p.slug === leftSlug);
    const rix = ranked.findIndex((p) => p.slug === rightSlug);
    if (lix === -1 && rix === -1) continue;

    const prob = getProblemPageBySlug(edge.problemSlug);
    const surf = getSurfacePageBySlug(edge.surfaceSlug);
    const scenarioLabel =
      prob && surf ? `${prob.title} on ${surf.title}` : `${pStr} on ${sStr}`;
    const playbookHref = `/surfaces/${edge.surfaceSlug}/${edge.problemSlug}`;
    const winnerName = winner.title ?? winner.slug;
    const runner = ranked[1];
    let note: string | undefined;
    if (winner.slug !== leftSlug && winner.slug !== rightSlug) {
      note = "Neither SKU leads here—library picks a different specialist.";
    }

    rows.push({
      scenarioLabel,
      playbookHref,
      winnerSlug: winner.slug,
      winnerName,
      runnerUp: runner ? (runner.title ?? runner.slug) : undefined,
      note,
    });
  }

  const keyed = new Map<string, ComparisonScenarioWinner>();
  for (const r of rows) {
    if (!keyed.has(r.playbookHref)) keyed.set(r.playbookHref, r);
  }

  const list = [...keyed.values()];
  list.sort((a, b) => {
    const aBoth =
      a.winnerSlug === leftSlug || a.winnerSlug === rightSlug ? 0 : 1;
    const bBoth =
      b.winnerSlug === leftSlug || b.winnerSlug === rightSlug ? 0 : 1;
    if (aBoth !== bBoth) return aBoth - bBoth;
    return a.scenarioLabel.localeCompare(b.scenarioLabel);
  });

  return list.slice(0, maxRows);
}
