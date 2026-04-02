import type { AnalyzedProduct, ProductSeed } from "./productTypes";
import { rateProduct } from "./productRating";

const GREASE = new Set([
  "grease buildup",
  "grease splatter",
  "cooked-on grease",
  "baked-on grease",
  "oil stains",
  "food residue",
  "sticky residue",
  "burnt residue",
  "cooked-on residue",
]);

const MINERAL = new Set([
  "mineral deposits",
  "limescale",
  "hard water film",
  "hard water stains",
  "scale deposits",
  "calcium buildup",
  "mineral haze",
  "white film",
  "cloudy film",
  "water spots",
]);

const ORGANIC_STAIN = new Set([
  "tannin stains",
  "dye transfer",
  "mildew stains",
  "discoloration",
  "pink slime",
  "biofilm",
  "mold growth",
  "organic stains",
  "pet odor",
  "urine",
  "bio-organic buildup",
]);

function deriveNarratives(
  seed: ProductSeed,
  scores: {
    cleaningPower: number;
    safety: number;
    surfaceCompatibility: number;
    easeOfUse: number;
    consistency: number;
  },
): Pick<AnalyzedProduct, "strengths" | "weaknesses" | "bestUseCases" | "worstUseCases"> {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const best: string[] = [];
  const worst: string[] = [];

  if (scores.cleaningPower >= 8) strengths.push("Strong expected performance on soils that match its chemistry class.");
  if (scores.safety >= 8) strengths.push("Relatively forgiving default safety profile when label directions are followed.");
  if (scores.surfaceCompatibility >= 8) strengths.push("Broad compatibility with the listed surface tags.");
  if (scores.easeOfUse >= 8) strengths.push("Low-friction application format for routine maintenance.");

  if (scores.safety <= 6) weaknesses.push("Requires careful handling, testing, and rinse discipline (especially around acid-sensitive finishes).");
  if (scores.surfaceCompatibility <= 6) weaknesses.push("Surface compatibility is narrower—spot testing and manufacturer guidance matter.");
  if (seed.notes) weaknesses.push(`Notes: ${seed.notes}`);

  if (seed.problems.some((p) => GREASE.has(p.toLowerCase()))) {
    best.push("Kitchen oils, fingerprints, and organic films on hard surfaces.");
  }
  if (seed.problems.some((p) => MINERAL.has(p.toLowerCase()) || p.toLowerCase() === "rust stains")) {
    best.push("Hard-water film, scale, and many mineral-bonded residues on tolerant surfaces.");
  }
  if (seed.problems.some((p) => ORGANIC_STAIN.has(p.toLowerCase()))) {
    best.push("Organic staining and many discoloration film cases where oxidation/bleach is appropriate.");
  }

  if (seed.chemicalClass === "enzyme") {
    best.push("Biological soils and odor sources (especially pet messes) where dwell time and label steps are followed.");
  }
  if (seed.chemicalClass === "acid") {
    worst.push("Acid-sensitive stone, damaged coatings, and unknown sealers without a spot test.");
  }
  if (seed.chemicalClass === "caustic") {
    worst.push("Any use outside labeled drain applications; mixing with other chemicals or surfaces.");
  }
  if (seed.chemicalClass === "oxygen_bleach") {
    worst.push("Mixing with acids or chlorinated products; colored materials without testing.");
  }

  if (best.length === 0) best.push("Routine cleaning aligned to the labeled surfaces and problems.");
  if (worst.length === 0) worst.push("Unknown materials, damaged finishes, or situations requiring professional restoration.");

  return {
    strengths,
    weaknesses,
    bestUseCases: best,
    worstUseCases: worst,
  };
}

export function analyzeAllProducts(seeds: ProductSeed[]): AnalyzedProduct[] {
  return seeds.map((seed) => {
    const rating = rateProduct(seed);
    const narratives = deriveNarratives(seed, {
      cleaningPower: rating.cleaningPower.score,
      safety: rating.safety.score,
      surfaceCompatibility: rating.surfaceCompatibility.score,
      easeOfUse: rating.easeOfUse.score,
      consistency: rating.consistency.score,
    });

    return {
      id: seed.id,
      slug: seed.slug,
      name: seed.name,
      brand: seed.brand,
      category: seed.category,
      chemicalClass: seed.chemicalClass,
      intent: seed.intent,
      compatibleProblems: [...seed.problems],
      compatibleSurfaces: [...seed.surfaces],
      strengths: narratives.strengths,
      weaknesses: narratives.weaknesses,
      bestUseCases: narratives.bestUseCases,
      worstUseCases: narratives.worstUseCases,
      rating,
      amazonUrl: seed.amazonUrl ?? "",
      amazonAffiliateUrl: seed.amazonAffiliateUrl ?? "",
      isPurchaseAvailable: seed.isPurchaseAvailable ?? false,
      buyLabel: seed.buyLabel ?? "Buy on Amazon",
      walmartUrl: seed.walmartUrl,
      homeDepotUrl: seed.homeDepotUrl,
      primaryImageUrl: seed.primaryImageUrl,
      imageUrls: seed.imageUrls,
    };
  });
}
