/**
 * Single source of truth for product comparison *lanes* and approved cross-cluster bridges.
 * Pair generation + scoring live in `authorityProductComparisonLattice.ts`.
 */

import { PRODUCT_PEER_CLUSTERS } from "@/lib/products/productPeerClusters";

/** Semantic lane for blacklist / bridge rules (not the same as peer cluster index). */
export type ComparisonLane =
  | "drain"
  | "daily_shower_maintain"
  | "bathroom_maintenance"
  | "kitchen_specialist"
  | "cooktop_precision"
  | "broad_kitchen_surfactant"
  | "broad_degreaser"
  | "mold_control"
  | "light_adhesive"
  | "everyday_adhesive"
  | "heavy_solvent"
  | "oven_specialist"
  | "hardwood_floor"
  | "hard_surface_floor"
  | "neutral_floor"
  | "vinyl_floor"
  | "enzyme"
  | "fabric_refresh"
  | "laundry_sanitizer"
  | "odor_neutralizer"
  | "stainless_polish"
  | "disinfectant"
  | "acid_descaler"
  | "glass_light_finish";

/** Default lane when a slug has no explicit override (by peer cluster index). */
export const COMPARISON_DEFAULT_LANE_BY_CLUSTER_INDEX: readonly ComparisonLane[] = [
  "drain",
  "daily_shower_maintain",
  "bathroom_maintenance",
  "kitchen_specialist",
  "broad_degreaser",
  "mold_control",
  "everyday_adhesive",
  "oven_specialist",
  "neutral_floor",
  "enzyme",
  "fabric_refresh",
  "stainless_polish",
  "disinfectant",
  "acid_descaler",
  "kitchen_specialist",
  "glass_light_finish",
] as const;

export function clusterIndicesForSlug(slug: string): number[] {
  const out: number[] = [];
  PRODUCT_PEER_CLUSTERS.forEach((c, i) => {
    if (c.includes(slug)) out.push(i);
  });
  return out;
}

/** Per-SKU lane overrides (split lanes inside a single peer cluster). */
export const COMPARISON_LANE_BY_SLUG: Partial<Record<string, ComparisonLane>> = {
  "cerama-bryte-cooktop-cleaner": "cooktop_precision",
  "goo-gone-spray-gel": "light_adhesive",
  "un-du-adhesive-remover": "light_adhesive",
  "goo-gone-original-liquid": "everyday_adhesive",
  "3m-adhesive-remover": "everyday_adhesive",
  "goof-off-professional-strength-remover": "heavy_solvent",
  "bona-hardwood-floor-cleaner": "hardwood_floor",
  "bona-hard-surface-floor-cleaner": "hard_surface_floor",
  "zep-neutral-ph-floor-cleaner": "neutral_floor",
  "rejuvenate-luxury-vinyl-floor-cleaner": "vinyl_floor",
  "febreze-fabric-refresher-antimicrobial": "fabric_refresh",
  "odoban-fabric-laundry-spray": "fabric_refresh",
  "lysol-laundry-sanitizer": "laundry_sanitizer",
  "clorox-laundry-sanitizer": "laundry_sanitizer",
  "zero-odor-eliminator-spray": "odor_neutralizer",
  "fresh-wave-odor-removing-spray": "odor_neutralizer",
  "dawn-platinum-dish-spray": "broad_kitchen_surfactant",
};

export function primaryLaneForSlug(slug: string): ComparisonLane {
  const override = COMPARISON_LANE_BY_SLUG[slug];
  if (override) return override;
  const idx = clusterIndicesForSlug(slug);
  if (idx.length === 0) return "kitchen_specialist";
  const i = Math.min(...idx);
  return COMPARISON_DEFAULT_LANE_BY_CLUSTER_INDEX[i] ?? "kitchen_specialist";
}

/**
 * Cross-cluster bridges: unordered cluster index pairs + optional shared-problem gates.
 * `requireAnyShared` means intersection of the two SKUs’ `problems` must include ≥1 listed string.
 */
export type ComparisonClusterBridge = {
  id: string;
  clusterA: number;
  clusterB: number;
  requireAnyShared?: readonly string[];
};

export const COMPARISON_CLUSTER_BRIDGES: readonly ComparisonClusterBridge[] = [
  { id: "kitchen_specialist_broad_degreaser", clusterA: 3, clusterB: 4 },
  { id: "dawn_krud_lane_broad_degreaser", clusterA: 14, clusterB: 4 },
  {
    id: "surfactant_kitchen_specialist",
    clusterA: 14,
    clusterB: 3,
    requireAnyShared: [
      "grease buildup",
      "greasy film",
      "food residue",
      "kitchen grease film",
      "light film",
      "cooked-on grease",
      "oil stains",
    ],
  },
  {
    id: "cooktop_stainless_visual",
    clusterA: 3,
    clusterB: 11,
    requireAnyShared: ["smudge marks", "light film", "fingerprints", "surface haze"],
  },
  {
    id: "oven_broad_baked",
    clusterA: 7,
    clusterB: 4,
    requireAnyShared: ["baked-on grease", "cooked-on grease", "burnt residue"],
  },
  {
    id: "kitchen_oven_burnt",
    clusterA: 3,
    clusterB: 7,
    requireAnyShared: ["burnt residue", "cooked-on grease", "baked-on grease"],
  },
  /**
   * High-yield bridge B: kitchen degreaser ↔ oven cleaner overlap
   * Gate: only baked/cooked carbon lane problems (avoids “any degreaser vs any cleaner” drift).
   */
  {
    id: "kitchen_oven_overlap",
    clusterA: 3,
    clusterB: 7,
    requireAnyShared: ["cooked-on grease", "burnt residue"],
  },
  { id: "daily_shower_bathroom_maintenance", clusterA: 1, clusterB: 2 },
  { id: "bathroom_maintenance_descaler", clusterA: 2, clusterB: 13 },
  /**
   * High-yield bridge A: daily shower maintenance ↔ acid descaler (real user decision).
   */
  {
    id: "daily_shower_descaler",
    clusterA: 1,
    clusterB: 13,
    requireAnyShared: ["soap scum", "hard water film"],
  },
  { id: "bathroom_maintenance_disinfectant", clusterA: 2, clusterB: 12 },
  { id: "mold_control_disinfectant", clusterA: 5, clusterB: 12 },
  {
    id: "mold_control_daily_shower",
    clusterA: 5,
    clusterB: 1,
    requireAnyShared: ["mold growth", "mildew stains", "mildew growth", "mold staining"],
  },
  {
    id: "floor_broad_floor_residue",
    clusterA: 8,
    clusterB: 4,
    requireAnyShared: ["floor residue"],
  },
  {
    id: "enzyme_odor_neutralizer",
    clusterA: 9,
    clusterB: 10,
    requireAnyShared: ["pet odor", "urine", "organic stains", "bio-organic buildup", "laundry odor"],
  },
  {
    id: "enzyme_disinfectant_bio",
    clusterA: 9,
    clusterB: 12,
    requireAnyShared: ["bio-organic buildup", "biofilm", "mold growth", "mildew stains", "bacteria buildup"],
  },
  /**
   * High-yield bridge C: disinfectant ↔ odor neutralizer
   * Gate: odor retention confusion + biological soil overlap.
   */
  {
    id: "disinfectant_odor_neutralizer",
    clusterA: 12,
    clusterB: 10,
    requireAnyShared: ["odor retention", "bio-organic buildup"],
  },
  {
    id: "stainless_polish_glass_light_finish",
    clusterA: 11,
    clusterB: 15,
    requireAnyShared: ["fingerprints", "surface haze", "smudge marks", "light film", "streaking"],
  },
  /** Hardwood / cabinet maintenance lane ↔ neutral floor lane (controlled). */
  { id: "wood_maintenance_floor_maintenance", clusterA: 2, clusterB: 8 },
] as const;

/**
 * Hard never-generate rules (lane + a few problem-aware guards).
 * Cross-cluster pairs must still pass an approved bridge + scorer in the lattice.
 */
export function isBlacklistedComparisonPair(
  laneA: ComparisonLane,
  laneB: ComparisonLane,
  problemsA: readonly string[],
  problemsB: readonly string[],
): boolean {
  const la = laneA;
  const lb = laneB;
  const allLower = [...problemsA, ...problemsB].map((p) => p.toLowerCase());
  const probSet = new Set(allLower);

  if ((la === "drain") !== (lb === "drain")) return true;

  if (
    (la === "laundry_sanitizer" && lb === "acid_descaler") ||
    (lb === "laundry_sanitizer" && la === "acid_descaler")
  ) {
    return true;
  }

  if (
    (la === "stainless_polish" && lb === "mold_control") ||
    (lb === "stainless_polish" && la === "mold_control")
  ) {
    return true;
  }

  if (
    (la === "stainless_polish" && lb === "acid_descaler") ||
    (lb === "stainless_polish" && la === "acid_descaler")
  ) {
    return true;
  }

  if ((la === "enzyme" && lb === "oven_specialist") || (lb === "enzyme" && la === "oven_specialist")) {
    return true;
  }

  if ((la === "fabric_refresh" && lb === "drain") || (lb === "fabric_refresh" && la === "drain")) {
    return true;
  }

  if ((la === "cooktop_precision" && lb === "drain") || (lb === "cooktop_precision" && la === "drain")) {
    return true;
  }

  if (
    (la === "cooktop_precision" && lb === "mold_control") ||
    (lb === "cooktop_precision" && la === "mold_control")
  ) {
    return true;
  }

  if (probSet.has("musty odor") && (la === "acid_descaler" || lb === "acid_descaler")) {
    return true;
  }

  return false;
}
