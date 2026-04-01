import { getSurfaceProblemEdges } from "@/authority/data/authorityGraphSelectors";
import {
  COMPARISON_CLUSTER_BRIDGES,
  clusterIndicesForSlug,
  isBlacklistedComparisonPair,
  primaryLaneForSlug,
} from "@/authority/data/authorityProductComparisonAdjacency";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import { getRecommendedProducts, inferRecommendationIntent } from "@/lib/products/getRecommendedProducts";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";
import { PRODUCT_PEER_CLUSTERS } from "@/lib/products/productPeerClusters";
import { PRODUCT_SEEDS } from "@/lib/products/productSeeds";
import { PRODUCTS } from "@/lib/products/products.seed";

const MIN_SCORE = 8;
const MAX_COMPARISONS = 180;
const MAX_PER_CLUSTER = 24;
const MAX_PER_PRODUCT = 8;

const PROBLEM_SET = new Map(PRODUCTS.map((p) => [p.slug, new Set(p.problems.map((x) => x.toLowerCase()))] as const));
const SURFACE_SET = new Map(PRODUCTS.map((p) => [p.slug, new Set(p.surfaces.map((x) => x.toLowerCase()))] as const));

const TAX_BY_SLUG = new Map(PRODUCT_SEEDS.map((p) => [p.slug, p]));

export type ComparisonLatticeReason = {
  slug: string;
  leftSlug: string;
  rightSlug: string;
  score: number;
  breakdown: string[];
  bridgeId: string;
  sameCluster: boolean;
};

export type ComparisonLatticeAudit = {
  accepted: ComparisonLatticeReason[];
  rejected: Array<{
    slug: string;
    leftSlug: string;
    rightSlug: string;
    reason: string;
    score?: number;
    bridgeId?: string;
  }>;
  bridgeAcceptCounts: Record<string, number>;
  bridgeRejectCounts: Record<string, number>;
  suspiciousLowScore: ComparisonLatticeReason[];
};

function sortPair(a: string, b: string): [string, string] {
  return a.localeCompare(b) <= 0 ? [a, b] : [b, a];
}

function normalizeComparisonSlug(leftSlug: string, rightSlug: string): string {
  const [left, right] = sortPair(leftSlug, rightSlug);
  return `${left}-vs-${right}`;
}

function sharedProblemsLower(a: string, b: string): Set<string> {
  const pa = PROBLEM_SET.get(a);
  const pb = PROBLEM_SET.get(b);
  if (!pa || !pb) return new Set();
  const out = new Set<string>();
  for (const x of pa) {
    if (pb.has(x)) out.add(x);
  }
  return out;
}

function sharedClusterIndex(a: string, b: string): number | null {
  for (const i of clusterIndicesForSlug(a)) {
    if (PRODUCT_PEER_CLUSTERS[i]?.includes(b)) return i;
  }
  return null;
}

function clustersForPair(left: string, right: string): Set<number> {
  const s = new Set<number>();
  for (const i of clusterIndicesForSlug(left)) s.add(i);
  for (const i of clusterIndicesForSlug(right)) s.add(i);
  return s;
}

function intraClusterOdorFabricGate(clusterIdx: number, slugA: string, slugB: string, sharedLower: Set<string>): boolean {
  if (clusterIdx !== 10) return true;
  const la = primaryLaneForSlug(slugA);
  const lb = primaryLaneForSlug(slugB);
  const lanes = new Set([la, lb]);
  if (lanes.has("fabric_refresh") && lanes.has("laundry_sanitizer")) {
    return sharedLower.has("laundry odor");
  }
  return true;
}

function bridgeAuthorizesCrossCluster(
  slugA: string,
  slugB: string,
  sharedLower: Set<string>,
): { bridgeId: string } | null {
  const idxA = clusterIndicesForSlug(slugA);
  const idxB = clusterIndicesForSlug(slugB);
  for (const br of COMPARISON_CLUSTER_BRIDGES) {
    if (br.clusterA === br.clusterB) continue;
    const hit =
      (idxA.includes(br.clusterA) && idxB.includes(br.clusterB)) ||
      (idxA.includes(br.clusterB) && idxB.includes(br.clusterA));
    if (!hit) continue;
    if (br.requireAnyShared?.length) {
      const ok = br.requireAnyShared.some((p) => sharedLower.has(p.toLowerCase()));
      if (!ok) continue;
    }
    return { bridgeId: br.id };
  }
  return null;
}

function authorizePair(
  slugA: string,
  slugB: string,
  sharedLower: Set<string>,
):
  | { kind: "intra"; clusterIndex: number; bridgeId: string }
  | { kind: "cross"; bridgeId: string }
  | null {
  if (sharedLower.size === 0) return null;

  const sci = sharedClusterIndex(slugA, slugB);
  if (sci !== null) {
    if (!intraClusterOdorFabricGate(sci, slugA, slugB, sharedLower)) return null;
    return { kind: "intra", clusterIndex: sci, bridgeId: "intra_cluster" };
  }

  const cross = bridgeAuthorizesCrossCluster(slugA, slugB, sharedLower);
  if (cross) return { kind: "cross", bridgeId: cross.bridgeId };
  return null;
}

function surfaceFamiliesForSlug(slug: string): Set<string> {
  const surf = SURFACE_SET.get(slug);
  const out = new Set<string>();
  if (!surf) return out;
  for (const s of surf) {
    if (s.includes("floor") || s.includes("vinyl") || s.includes("hardwood")) out.add("floor");
    if (s.includes("glass") || s.includes("mirror")) out.add("glass");
    if (s.includes("stainless") || s.includes("appliance") || s.includes("cooktop") || s.includes("hood")) {
      out.add("kitchen_metal");
    }
    if (s.includes("tile") || s.includes("porcelain") || s.includes("ceramic") || s.includes("grout")) {
      out.add("hard_bath");
    }
    if (s.includes("fabric") || s.includes("laundry") || s.includes("upholstery") || s.includes("carpet")) {
      out.add("soft");
    }
    if (s === "drains") out.add("drain");
  }
  return out;
}

function sharedSurfaceFamilyBonus(a: string, b: string): boolean {
  const fa = surfaceFamiliesForSlug(a);
  const fb = surfaceFamiliesForSlug(b);
  for (const x of fa) {
    if (fb.has(x)) return true;
  }
  return false;
}

function strengthOrder(s: string): number {
  if (s === "light") return 0;
  if (s === "moderate") return 1;
  if (s === "heavy-duty") return 2;
  if (s === "restoration") return 3;
  return 1;
}

function specialistBroadBonus(a: string, b: string): boolean {
  const ta = TAX_BY_SLUG.get(a);
  const tb = TAX_BY_SLUG.get(b);
  if (!ta || !tb) return false;
  return Math.abs(strengthOrder(ta.cleaningStrength) - strengthOrder(tb.cleaningStrength)) >= 2;
}

function hardCautionMismatch(a: string, b: string): boolean {
  const ta = TAX_BY_SLUG.get(a);
  const tb = TAX_BY_SLUG.get(b);
  if (!ta || !tb) return false;
  const incA = new Set((ta.incompatibleSurfaces ?? []).map((x) => x.toLowerCase()));
  const incB = new Set((tb.incompatibleSurfaces ?? []).map((x) => x.toLowerCase()));
  const compA = new Set(ta.compatibleSurfaces.map((x) => x.toLowerCase()));
  const compB = new Set(tb.compatibleSurfaces.map((x) => x.toLowerCase()));
  for (const s of incA) {
    if (compB.has(s)) return true;
  }
  for (const s of incB) {
    if (compA.has(s)) return true;
  }
  return false;
}

function productListsPlaybook(slug: string, problem: string, surface: string): boolean {
  const p = PRODUCTS.find((x) => x.slug === slug);
  if (!p) return false;
  return (
    p.problems.some((x) => x.toLowerCase() === problem.toLowerCase()) &&
    p.surfaces.some((x) => x.toLowerCase() === surface.toLowerCase())
  );
}

function bothInTopNPlaybook(slugA: string, slugB: string, n: number): boolean {
  for (const edge of getSurfaceProblemEdges()) {
    const pStr = productProblemStringForAuthorityProblemSlug(edge.problemSlug);
    const sStr = productSurfaceStringForAuthoritySurfaceSlug(edge.surfaceSlug);
    if (!pStr || !sStr) continue;
    if (!productListsPlaybook(slugA, pStr, sStr) || !productListsPlaybook(slugB, pStr, sStr)) continue;
    const intent = inferRecommendationIntent(pStr) as ProductCleaningIntent;
    const ranked = getRecommendedProducts({ problem: pStr, surface: sStr, limit: 8, intent });
    const ia = ranked.findIndex((r) => r.slug === slugA);
    const ib = ranked.findIndex((r) => r.slug === slugB);
    if (ia >= 0 && ia <= n - 1 && ib >= 0 && ib <= n - 1) return true;
  }
  return false;
}

/** Both SKUs list the same authority surface×problem playbook (engine can rank them there). */
function sharedPlaybookEligibility(slugA: string, slugB: string): boolean {
  for (const edge of getSurfaceProblemEdges()) {
    const pStr = productProblemStringForAuthorityProblemSlug(edge.problemSlug);
    const sStr = productSurfaceStringForAuthoritySurfaceSlug(edge.surfaceSlug);
    if (!pStr || !sStr) continue;
    if (productListsPlaybook(slugA, pStr, sStr) && productListsPlaybook(slugB, pStr, sStr)) return true;
  }
  return false;
}

function scorePair(
  slugA: string,
  slugB: string,
  auth: { kind: "intra" | "cross"; bridgeId: string },
  sharedCount: number,
): { score: number; breakdown: string[] } {
  const breakdown: string[] = [];
  let score = 0;

  if (auth.kind === "intra") {
    score += 4;
    breakdown.push("same_cluster:+4");
    if (sharedCount >= 2) {
      score += 2;
      breakdown.push("intra_multi_problem_overlap:+2");
    }
  } else {
    score += 3;
    breakdown.push("approved_adjacent_bridge:+3");
    if (sharedCount >= 2) {
      score += 2;
      breakdown.push("cross_bridge_multi_problem_overlap:+2");
    }
  }

  const sharedProblemPoints = Math.min(sharedCount, 2) * 3;
  score += sharedProblemPoints;
  breakdown.push(`shared_compatible_problems:x${Math.min(sharedCount, 2)}:+${sharedProblemPoints}`);

  if (sharedCount >= 3) {
    score += 2;
    breakdown.push("deep_shared_problem_overlap:+2");
  }

  if (sharedSurfaceFamilyBonus(slugA, slugB)) {
    score += 2;
    breakdown.push("shared_surface_family:+2");
  }

  const top3 = bothInTopNPlaybook(slugA, slugB, 3);
  if (top3) {
    score += 4;
    breakdown.push("both_top3_shared_scenario:+4");
  }

  const top5 = !top3 && bothInTopNPlaybook(slugA, slugB, 5);
  if (top5) {
    score += 2;
    breakdown.push("both_top5_shared_scenario:+2");
  }

  const playbookEligible = sharedPlaybookEligibility(slugA, slugB);
  if (playbookEligible) {
    score += 2;
    breakdown.push("both_eligible_same_authority_playbook:+2");
  }

  if (specialistBroadBonus(slugA, slugB)) {
    score += 2;
    breakdown.push("specialist_vs_broad_strength:+2");
  }

  if (hardCautionMismatch(slugA, slugB)) {
    score -= 4;
    breakdown.push("hard_caution_surface_mismatch:-4");
  }

  if (!top3) {
    // Adjacent-lane comparisons often don't co-rank top-3 but are still valid. Soften only for bridges.
    const miss = auth.kind === "cross" ? -3 : -5;
    score += miss;
    breakdown.push(
      auth.kind === "cross" ? "no_shared_top3_engine_evidence_adjacent:-3" : "no_shared_top3_engine_evidence:-5",
    );
  }

  return { score, breakdown };
}

function iterPairs(cluster: readonly string[]): [string, string][] {
  const known = cluster.filter((slug) => PROBLEM_SET.has(slug));
  const out: [string, string][] = [];
  for (let i = 0; i < known.length; i++) {
    for (let j = i + 1; j < known.length; j++) {
      out.push([known[i]!, known[j]!]);
    }
  }
  return out;
}

function iterCrossPairs(aCluster: readonly string[], bCluster: readonly string[]): [string, string][] {
  const aKnown = aCluster.filter((slug) => PROBLEM_SET.has(slug));
  const bKnown = bCluster.filter((slug) => PROBLEM_SET.has(slug));
  const out: [string, string][] = [];
  for (const a of aKnown) {
    for (const b of bKnown) {
      if (a === b) continue;
      out.push([a, b]);
    }
  }
  return out;
}

/** Enumerate all unordered candidate pairs (deduped by normalized slug), with bridge hints for cross-cluster. */
function enumerateRawPairs(): Map<
  string,
  { left: string; right: string; auth: { kind: "intra" | "cross"; bridgeId: string } | null }
> {
  const out = new Map<string, { left: string; right: string; auth: ReturnType<typeof authorizePair> }>();

  for (let ci = 0; ci < PRODUCT_PEER_CLUSTERS.length; ci++) {
    const cluster = PRODUCT_PEER_CLUSTERS[ci]!;
    for (const [a, b] of iterPairs(cluster)) {
      const shared = sharedProblemsLower(a, b);
      if (shared.size === 0) continue;
      const auth = authorizePair(a, b, shared);
      const [left, right] = sortPair(a, b);
      const slug = normalizeComparisonSlug(left, right);
      if (!out.has(slug)) out.set(slug, { left, right, auth });
    }
  }

  for (const br of COMPARISON_CLUSTER_BRIDGES) {
    if (br.clusterA === br.clusterB) continue;
    const ca = PRODUCT_PEER_CLUSTERS[br.clusterA];
    const cb = PRODUCT_PEER_CLUSTERS[br.clusterB];
    if (!ca || !cb) continue;
    for (const [a, b] of iterCrossPairs(ca, cb)) {
      const shared = sharedProblemsLower(a, b);
      if (shared.size === 0) continue;
      const auth = authorizePair(a, b, shared);
      const [left, right] = sortPair(a, b);
      const slug = normalizeComparisonSlug(left, right);
      const prev = out.get(slug);
      if (!prev) {
        out.set(slug, { left, right, auth });
      } else if (!prev.auth && auth) {
        out.set(slug, { left, right, auth });
      }
    }
  }

  return out;
}

const PRIORITY_NORMALIZED_SLUGS: string[] = [
  normalizeComparisonSlug("clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"),
  normalizeComparisonSlug("clr-calcium-lime-rust", "lime-a-way-cleaner"),
  normalizeComparisonSlug("zep-calcium-lime-rust-remover", "lime-a-way-cleaner"),
  normalizeComparisonSlug("dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"),
  normalizeComparisonSlug("goo-gone-original-liquid", "un-du-adhesive-remover"),
  normalizeComparisonSlug("goo-gone-original-liquid", "3m-adhesive-remover"),
  normalizeComparisonSlug("goo-gone-original-liquid", "goof-off-professional-strength-remover"),
  normalizeComparisonSlug("bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"),
  normalizeComparisonSlug("bona-hard-surface-floor-cleaner", "rejuvenate-luxury-vinyl-floor-cleaner"),
  normalizeComparisonSlug("zep-neutral-ph-floor-cleaner", "rejuvenate-luxury-vinyl-floor-cleaner"),
  normalizeComparisonSlug("natures-miracle-stain-and-odor-remover", "rocco-roxie-stain-odor-eliminator"),
  normalizeComparisonSlug("natures-miracle-stain-and-odor-remover", "biokleen-bac-out-stain-odor-remover"),
  normalizeComparisonSlug("rocco-roxie-stain-odor-eliminator", "biokleen-bac-out-stain-odor-remover"),
  normalizeComparisonSlug("lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray"),
  normalizeComparisonSlug("lysol-disinfectant-spray", "odoban-disinfectant-odor-eliminator"),
  normalizeComparisonSlug("microban-24-hour-disinfectant-sanitizing-spray", "odoban-disinfectant-odor-eliminator"),
  normalizeComparisonSlug("easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner"),
  normalizeComparisonSlug("cerama-bryte-cooktop-cleaner", "weiman-gas-range-cleaner-degreaser"),
  normalizeComparisonSlug("febreze-fabric-refresher-antimicrobial", "zero-odor-eliminator-spray"),
  normalizeComparisonSlug("febreze-fabric-refresher-antimicrobial", "fresh-wave-odor-removing-spray"),
  normalizeComparisonSlug("zero-odor-eliminator-spray", "fresh-wave-odor-removing-spray"),
];

export function buildProductComparisonLatticeAudit(): ComparisonLatticeAudit {
  const accepted: ComparisonLatticeReason[] = [];
  const rejected: ComparisonLatticeAudit["rejected"] = [];
  const bridgeAcceptCounts: Record<string, number> = {};
  const bridgeRejectCounts: Record<string, number> = {};

  const bumpReject = (bridgeId: string | undefined) => {
    const k = bridgeId ?? "unauthorized_cross_cluster";
    bridgeRejectCounts[k] = (bridgeRejectCounts[k] ?? 0) + 1;
  };

  const raw = enumerateRawPairs();

  type Scored = ComparisonLatticeReason;
  const scored: Scored[] = [];

  for (const { left, right, auth } of raw.values()) {
    const laneA = primaryLaneForSlug(left);
    const laneB = primaryLaneForSlug(right);
    const pa = PRODUCTS.find((p) => p.slug === left);
    const pb = PRODUCTS.find((p) => p.slug === right);
    if (!pa || !pb) {
      rejected.push({ slug: normalizeComparisonSlug(left, right), leftSlug: left, rightSlug: right, reason: "missing_seed" });
      continue;
    }

    if (isBlacklistedComparisonPair(laneA, laneB, pa.problems, pb.problems)) {
      rejected.push({
        slug: normalizeComparisonSlug(left, right),
        leftSlug: left,
        rightSlug: right,
        reason: "blacklisted_lane_or_guard",
      });
      bumpReject(auth?.bridgeId);
      continue;
    }

    const sharedLower = sharedProblemsLower(left, right);
    if (sharedLower.size === 0) {
      rejected.push({
        slug: normalizeComparisonSlug(left, right),
        leftSlug: left,
        rightSlug: right,
        reason: "no_shared_compatible_problem",
      });
      continue;
    }

    if (!auth) {
      rejected.push({
        slug: normalizeComparisonSlug(left, right),
        leftSlug: left,
        rightSlug: right,
        reason: "not_same_cluster_and_no_bridge",
      });
      bumpReject(undefined);
      continue;
    }

    const sharedCount = sharedLower.size;
    const { score, breakdown } = scorePair(left, right, auth, sharedCount);

    const row: Scored = {
      slug: normalizeComparisonSlug(left, right),
      leftSlug: left,
      rightSlug: right,
      score,
      breakdown,
      bridgeId: auth.bridgeId,
      sameCluster: auth.kind === "intra",
    };

    if (score < MIN_SCORE) {
      rejected.push({
        slug: row.slug,
        leftSlug: left,
        rightSlug: right,
        reason: `below_min_score(${score}<${MIN_SCORE})`,
        score,
        bridgeId: auth.bridgeId,
      });
      bumpReject(auth.bridgeId);
      continue;
    }

    scored.push(row);
  }

  const prioritySet = new Set(PRIORITY_NORMALIZED_SLUGS);
  scored.sort((x, y) => {
    const px = prioritySet.has(x.slug) ? 0 : 1;
    const py = prioritySet.has(y.slug) ? 0 : 1;
    if (px !== py) return px - py;
    if (y.score !== x.score) return y.score - x.score;
    return x.slug.localeCompare(y.slug);
  });

  const clusterUse = new Map<number, number>();
  const productUse = new Map<string, number>();

  const suspiciousLowScore: ComparisonLatticeReason[] = [];

  for (const row of scored) {
    if (accepted.length >= MAX_COMPARISONS) break;

    const { leftSlug: left, rightSlug: right } = row;
    if ((productUse.get(left) ?? 0) >= MAX_PER_PRODUCT || (productUse.get(right) ?? 0) >= MAX_PER_PRODUCT) {
      rejected.push({
        slug: row.slug,
        leftSlug: left,
        rightSlug: right,
        reason: "cap_per_product",
        score: row.score,
        bridgeId: row.bridgeId,
      });
      bumpReject(row.bridgeId);
      continue;
    }

    let clusterCapHit = false;
    const trial = new Map(clusterUse);
    for (const i of clustersForPair(left, right)) {
      trial.set(i, (trial.get(i) ?? 0) + 1);
    }
    for (const [i, n] of trial) {
      if (n > MAX_PER_CLUSTER) {
        clusterCapHit = true;
        break;
      }
    }
    if (clusterCapHit) {
      rejected.push({
        slug: row.slug,
        leftSlug: left,
        rightSlug: right,
        reason: "cap_per_cluster",
        score: row.score,
        bridgeId: row.bridgeId,
      });
      bumpReject(row.bridgeId);
      continue;
    }

    for (const i of clustersForPair(left, right)) {
      clusterUse.set(i, (clusterUse.get(i) ?? 0) + 1);
    }
    productUse.set(left, (productUse.get(left) ?? 0) + 1);
    productUse.set(right, (productUse.get(right) ?? 0) + 1);
    accepted.push(row);
    bridgeAcceptCounts[row.bridgeId] = (bridgeAcceptCounts[row.bridgeId] ?? 0) + 1;
    if (row.score <= MIN_SCORE + 1) suspiciousLowScore.push(row);
  }

  return { accepted, rejected, bridgeAcceptCounts, bridgeRejectCounts, suspiciousLowScore };
}

export function buildAuthorityProductComparisonSeedsFromLattice(): {
  type: "product_comparison";
  leftSlug: string;
  rightSlug: string;
}[] {
  const { accepted } = buildProductComparisonLatticeAudit();
  return accepted.map((r) => ({
    type: "product_comparison" as const,
    leftSlug: r.leftSlug,
    rightSlug: r.rightSlug,
  }));
}
