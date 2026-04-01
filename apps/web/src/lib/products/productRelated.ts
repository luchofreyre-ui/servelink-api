import type { ProductCleaningIntent, PublishedProductSnapshot } from "./productTypes";
import { getAllPublishedProducts } from "./productPublishing";
import { PRODUCT_PEER_CLUSTERS } from "./productPeerClusters";
import {
  inferRecommendationIntent,
  intentAlignmentBoost,
  intentChemistryAdjustment,
} from "./getRecommendedProducts";
import { effectivenessForProblem } from "./productRating";

export type ProductLike = {
  slug: string;
  finalScore?: number;
  score?: number;
  compatibleProblems?: string[];
  compatibleSurfaces?: string[];
  chemicalClass?: string | null;
  intent?: ProductCleaningIntent;
  rating?: { finalScore?: number };
};

export type GetRelatedProductsOptions = {
  mode?: "better" | "similar";
  limit?: number;
};

const MINERAL_HEAVY = new Set([
  "limescale",
  "mineral deposits",
  "calcium buildup",
  "rust stains",
  "hard water stains",
  "hard water film",
]);

const GREASE_KITCHEN = new Set([
  "grease buildup",
  "oil stains",
  "food residue",
  "burnt residue",
  "cooked-on residue",
  "cooked-on grease",
  "baked-on grease",
  "greasy film",
  "kitchen grease film",
  "light film",
]);

const KITCHEN_HOOD_SPECIALIST_SLUGS = new Set([
  "weiman-gas-range-cleaner-degreaser",
  "easy-off-kitchen-degreaser",
  "krud-kutter-kitchen-degreaser",
]);

function scoreValue(product: ProductLike | PublishedProductSnapshot): number {
  const p = product as ProductLike & PublishedProductSnapshot;
  return p.finalScore ?? p.score ?? p.rating?.finalScore ?? 0;
}

function overlapCount(a: string[] = [], b: string[] = []) {
  const setB = new Set(b);
  return a.filter((item) => setB.has(item)).length;
}

function chemistryFitAverage(chemicalClass: string, problems: readonly string[]): number {
  if (!problems.length) return 0;
  let sum = 0;
  for (const pr of problems) {
    sum += effectivenessForProblem(chemicalClass, pr);
  }
  return sum / problems.length;
}

function inferIntentFromProductProblems(problems: readonly string[]): ProductCleaningIntent {
  const intents = new Set(problems.map((p) => inferRecommendationIntent(p)));
  if (intents.has("disinfect")) return "disinfect";
  if (intents.has("maintain")) return "maintain";
  if (intents.has("restore")) return "restore";
  if (intents.has("remove_residue")) return "remove_residue";
  return "clean";
}

function betterChemistryRank(
  current: ProductLike | PublishedProductSnapshot,
  candidate: PublishedProductSnapshot,
): number {
  const probs = current.compatibleProblems ?? [];
  const chem = candidate.chemicalClass ?? "neutral";
  let rank = chemistryFitAverage(chem, probs) * 5;
  rank += overlapCount(probs, candidate.compatibleProblems) * 4;
  rank += overlapCount(current.compatibleSurfaces ?? [], candidate.compatibleSurfaces) * 2;

  const currentSnap = current as ProductLike & PublishedProductSnapshot;
  const effectiveIntent = currentSnap.intent ?? inferIntentFromProductProblems(probs);
  rank += intentChemistryAdjustment(candidate, effectiveIntent);
  rank += intentAlignmentBoost(candidate, effectiveIntent);

  if (candidate.slug === "heinz-distilled-white-vinegar-5pct") {
    const heavy = probs.some((p) => MINERAL_HEAVY.has(p));
    const grease = probs.some((p) => GREASE_KITCHEN.has(p));
    if (heavy) rank -= 28;
    if (grease) rank -= 12;
  }

  const currentMineralHeavy = probs.some((p) => MINERAL_HEAVY.has(p));
  if (currentMineralHeavy && candidate.slug === "clr-calcium-lime-rust") rank += 14;
  if (currentMineralHeavy && candidate.slug === "lime-a-way-cleaner") rank += 13;
  if (currentMineralHeavy && candidate.slug === "zep-calcium-lime-rust-remover") rank += 15;
  if (currentMineralHeavy && candidate.slug === "bar-keepers-friend-cleanser") rank += 8;

  const currentGrease = probs.some((p) => GREASE_KITCHEN.has(p));
  if (currentGrease && candidate.slug === "dawn-platinum-dish-spray") rank += 12;
  if (currentGrease && candidate.slug === "krud-kutter-original-cleaner-degreaser") rank += 14;
  if (currentGrease && candidate.slug === "method-heavy-duty-degreaser") rank += 13;
  if (currentGrease && candidate.slug === "simple-green-all-purpose-cleaner") rank += 10;
  if (currentGrease && candidate.slug === "heinz-distilled-white-vinegar-5pct") rank -= 10;

  const cooktopSurfaceHint = (current.compatibleSurfaces ?? []).some((x) => {
    const u = x.toLowerCase();
    return u.includes("cooktop") || u.includes("range hood") || u.includes("stainless steel appliances");
  });
  if (currentGrease && cooktopSurfaceHint && KITCHEN_HOOD_SPECIALIST_SLUGS.has(candidate.slug)) rank += 18;

  const outdoorGreaseHint = (current.compatibleSurfaces ?? []).some((x) => {
    const u = x.toLowerCase();
    return u.includes("concrete") || u.includes("outdoor concrete");
  });
  if (currentGrease && outdoorGreaseHint) {
    if (candidate.slug === "oil-eater-cleaner-degreaser") rank += 16;
    if (candidate.slug === "purple-power-industrial-strength-cleaner-degreaser") rank += 16;
  }

  const glassVisualProblems = new Set(["streaking", "dust buildup", "product residue"]);
  if (probs.some((p) => glassVisualProblems.has(p))) {
    if (candidate.slug === "windex-original-glass-cleaner") rank += 12;
    if (candidate.slug === "sprayway-glass-cleaner") rank += 13;
    if (candidate.slug === "invisible-glass-premium-glass-cleaner") rank += 14;
  }

  if (
    probs.some(
      (p) =>
        p === "adhesive residue" ||
        p === "sticky residue" ||
        p === "wax buildup" ||
        p === "light adhesive residue",
    )
  ) {
    if (candidate.slug === "un-du-adhesive-remover") rank += 16;
    if (candidate.slug === "goo-gone-spray-gel") rank += 17;
    if (candidate.slug === "goo-gone-original-liquid") rank += 13;
    if (candidate.slug === "goof-off-professional-strength-remover") rank += 17;
    if (candidate.slug === "3m-adhesive-remover") rank += 15;
  }

  const toiletScaleProblems = new Set([
    "limescale",
    "calcium buildup",
    "hard water stains",
    "rust stains",
    "mineral deposits",
  ]);
  if (probs.some((p) => toiletScaleProblems.has(p))) {
    if (candidate.slug === "lysol-power-toilet-bowl-cleaner") rank += 12;
    if (candidate.slug === "clorox-toilet-bowl-cleaner-bleach") rank += 6;
  }

  const stoneDaily = new Set(["granite-gold-daily-cleaner", "stonetech-daily-cleaner"]);
  if (stoneDaily.has(current.slug) && stoneDaily.has(candidate.slug)) rank += 14;
  if (stoneDaily.has(current.slug) && ACID_MINERAL_SLUGS.has(candidate.slug)) rank -= 40;

  const floorPeers = new Set([
    "bona-hardwood-floor-cleaner",
    "bona-hard-surface-floor-cleaner",
    "zep-neutral-ph-floor-cleaner",
    "rejuvenate-luxury-vinyl-floor-cleaner",
  ]);
  if (floorPeers.has(current.slug) && floorPeers.has(candidate.slug)) rank += 14;
  if (floorPeers.has(current.slug) && KITCHEN_GREASE_SLUGS.has(candidate.slug)) rank -= 28;

  const ovenPeers = new Set(["easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner"]);
  if (ovenPeers.has(current.slug) && ovenPeers.has(candidate.slug)) rank += 16;

  const woodCabinetPeers = new Set([
    "murphy-oil-soap-wood-cleaner",
    "pledge-multisurface-cleaner",
    "pledge-everyday-clean-multisurface",
    "method-wood-for-good-daily-clean",
  ]);
  if (woodCabinetPeers.has(current.slug) && woodCabinetPeers.has(candidate.slug)) rank += 12;

  const showerMaintainPeers = new Set([
    "wet-and-forget-shower-cleaner",
    "method-daily-shower-spray",
    "tilex-daily-shower-cleaner",
    "scrubbing-bubbles-daily-shower-cleaner",
  ]);
  if (showerMaintainPeers.has(current.slug) && showerMaintainPeers.has(candidate.slug)) rank += 14;

  const stainlessPolishPeers = new Set([
    "weiman-stainless-steel-cleaner-polish",
    "therapy-stainless-steel-cleaner-polish",
    "sprayway-stainless-steel-cleaner",
  ]);
  if (stainlessPolishPeers.has(current.slug) && stainlessPolishPeers.has(candidate.slug)) rank += 16;

  const moldControlPeers = new Set(["concrobium-mold-control", "mold-armor-rapid-clean-remediation"]);
  if (moldControlPeers.has(current.slug) && moldControlPeers.has(candidate.slug)) rank += 14;

  const enzymePeers = new Set([
    "natures-miracle-stain-and-odor-remover",
    "rocco-roxie-stain-odor-eliminator",
    "biokleen-bac-out-stain-odor-remover",
  ]);
  if (enzymePeers.has(current.slug) && enzymePeers.has(candidate.slug)) rank += 16;

  const laundrySanPeers = new Set([
    "lysol-laundry-sanitizer",
    "clorox-laundry-sanitizer",
    "odoban-fabric-laundry-spray",
    "febreze-fabric-refresher-antimicrobial",
    "zero-odor-eliminator-spray",
    "fresh-wave-odor-removing-spray",
  ]);
  if (laundrySanPeers.has(current.slug) && laundrySanPeers.has(candidate.slug)) rank += 16;

  const disinfectSprayPeers = new Set([
    "lysol-disinfectant-spray",
    "microban-24-hour-disinfectant-sanitizing-spray",
    "odoban-disinfectant-odor-eliminator",
  ]);
  if (disinfectSprayPeers.has(current.slug) && disinfectSprayPeers.has(candidate.slug)) rank += 12;

  const carpetSpotters = new Set(["resolve-carpet-cleaner-spray", "folex-instant-carpet-spot-remover"]);
  if (carpetSpotters.has(current.slug) && carpetSpotters.has(candidate.slug)) rank += 14;
  if (carpetSpotters.has(current.slug) && candidate.slug === "oxiclean-versatile-stain-remover") rank -= 10;

  if (current.slug === "natures-miracle-stain-and-odor-remover" && candidate.slug === "odoban-disinfectant-odor-eliminator")
    rank += 6;
  if (current.slug === "odoban-disinfectant-odor-eliminator" && candidate.slug === "natures-miracle-stain-and-odor-remover")
    rank += 6;

  if (current.slug === "wet-and-forget-shower-cleaner" && BATH_MAINTENANCE_SLUGS.has(candidate.slug)) rank += 8;
  if (BATH_MAINTENANCE_SLUGS.has(current.slug) && candidate.slug === "wet-and-forget-shower-cleaner") rank += 6;

  const finishProblems = new Set(["fingerprints", "surface haze", "smudge marks", "light film", "streaking"]);
  if (
    stainlessPolishPeers.has(current.slug) &&
    probs.some((p) => finishProblems.has(p)) &&
    candidate.slug === "windex-original-glass-cleaner"
  )
    rank += 8;

  const moldMaintainPeers = new Set([
    "concrobium-mold-control",
    "mold-armor-rapid-clean-remediation",
    "tilex-daily-shower-cleaner",
    "method-daily-shower-spray",
    "wet-and-forget-shower-cleaner",
    "scrubbing-bubbles-daily-shower-cleaner",
  ]);
  if (moldMaintainPeers.has(current.slug) && moldMaintainPeers.has(candidate.slug)) rank += 10;

  rank += scoreValue(candidate) * 0.35;
  return rank;
}

const ACID_MINERAL_SLUGS = new Set([
  "clr-calcium-lime-rust",
  "lime-a-way-cleaner",
  "zep-calcium-lime-rust-remover",
  "bar-keepers-friend-cleanser",
]);

const KITCHEN_GREASE_SLUGS = new Set([
  "dawn-platinum-dish-spray",
  "krud-kutter-original-cleaner-degreaser",
  "method-heavy-duty-degreaser",
]);

const BATH_MAINTENANCE_SLUGS = new Set([
  "scrubbing-bubbles-bathroom-grime-fighter",
  "scrubbing-bubbles-daily-shower-cleaner",
  "zep-shower-tub-tile-cleaner",
  "lysol-power-bathroom-cleaner",
  "tilex-daily-shower-cleaner",
  "concrobium-mold-control",
  "mold-armor-rapid-clean-remediation",
]);

const DRAIN_OPENER_SLUGS = new Set([
  "drano-max-gel-drain-clog-remover",
  "liquid-plumr-clog-destroyer-plus-pipeguard",
]);

function isExplicitPeer(currentSlug: string, candidateSlug: string): boolean {
  return PRODUCT_PEER_CLUSTERS.some((c) => c.includes(currentSlug) && c.includes(candidateSlug));
}

export function getRelatedProducts(
  current: ProductLike | PublishedProductSnapshot,
  options: GetRelatedProductsOptions = {},
): PublishedProductSnapshot[] {
  const { mode = "similar", limit = 3 } = options;

  const allProducts = getAllPublishedProducts();

  const currentScore = scoreValue(current);

  if (DRAIN_OPENER_SLUGS.has(current.slug) && mode === "better") {
    return [];
  }

  if (DRAIN_OPENER_SLUGS.has(current.slug) && mode === "similar") {
    return allProducts.filter((p) => p.slug !== current.slug && DRAIN_OPENER_SLUGS.has(p.slug)).slice(0, limit);
  }

  if (mode === "better") {
    const ranked = allProducts
      .filter((candidate) => candidate.slug !== current.slug)
      .map((candidate) => ({
        candidate,
        rank: betterChemistryRank(current, candidate),
        candidateScore: scoreValue(candidate),
      }))
      .sort((a, b) => {
        if (b.rank !== a.rank) return b.rank - a.rank;
        if (b.candidateScore !== a.candidateScore) return b.candidateScore - a.candidateScore;
        return a.candidate.slug.localeCompare(b.candidate.slug);
      });
    return ranked.slice(0, limit).map((x) => x.candidate);
  }

  const ranked = allProducts
    .filter((candidate) => candidate.slug !== current.slug)
    .map((candidate) => {
      const sharedProblems = overlapCount(current.compatibleProblems ?? [], candidate.compatibleProblems);
      const sharedSurfaces = overlapCount(current.compatibleSurfaces ?? [], candidate.compatibleSurfaces);
      const chemistryMatch =
        current.chemicalClass &&
        candidate.chemicalClass &&
        current.chemicalClass === candidate.chemicalClass
          ? 1
          : 0;

      const candidateScore = scoreValue(candidate);
      const scoreDelta = candidateScore - currentScore;
      const closeness = Math.max(0, 5 - Math.abs(scoreDelta));

      let rank = sharedProblems * 3 + sharedSurfaces * 2 + chemistryMatch + closeness;

      if (isExplicitPeer(current.slug, candidate.slug)) rank += 48;

      if (candidate.slug === "heinz-distilled-white-vinegar-5pct") {
        const probs = current.compatibleProblems ?? [];
        if (probs.some((p) => MINERAL_HEAVY.has(p))) rank -= 8;
      }

      return { candidate, rank, candidateScore };
    })
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      if (b.candidateScore !== a.candidateScore) return b.candidateScore - a.candidateScore;
      return a.candidate.slug.localeCompare(b.candidate.slug);
    });

  return ranked.slice(0, limit).map((item) => item.candidate);
}
