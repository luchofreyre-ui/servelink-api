import type { AuthorityClusterType, AuthorityProblemCategory } from "../types/authorityPageTypes";

export interface AuthorityClusterSeed {
  type: AuthorityClusterType;
  slug: string;
  title: string;
  description: string;
  intro: string;
  problemCategories?: AuthorityProblemCategory[];
  methodSlugs?: string[];
  surfaceSlugs?: string[];
  guideSlugs?: string[];
}

export const AUTHORITY_CLUSTER_SEEDS: AuthorityClusterSeed[] = [
  {
    type: "problem_category",
    slug: "mineral-buildup-and-hard-water",
    title: "Mineral buildup and hard water",
    description:
      "A structured cluster covering hard water deposits, limescale, soap-related mineral residue, and the methods and surfaces commonly linked to them.",
    intro:
      "Mineral-related cleaning problems often look similar at first glance, but they behave differently from oil-based or transfer-related issues. This cluster groups the surfaces, methods, and problems most closely tied to hard-water and mineral residue patterns.",
    problemCategories: ["mineral", "residue"],
    guideSlugs: ["how-to-remove-stains-safely", "why-cleaning-fails"],
  },
  {
    type: "problem_category",
    slug: "oil-and-kitchen-residue",
    title: "Oil and kitchen residue",
    description:
      "A structured cluster covering grease buildup, stuck-on residue, kitchen films, and the methods and surfaces most closely tied to them.",
    intro:
      "Oil-based contamination creates a different cleaning decision tree from mineral or biological problems. This cluster groups kitchen-heavy residues with the methods and surfaces that usually connect to them.",
    problemCategories: ["oil_based", "organic", "residue"],
    guideSlugs: ["how-to-remove-stains-safely", "why-cleaning-fails"],
  },
  {
    type: "problem_category",
    slug: "damage-and-finish-risk",
    title: "Damage and finish risk",
    description:
      "A structured cluster covering etching, scratching, finish disruption, and other cases where cleaning risk can become part of the problem.",
    intro:
      "Some cleaning problems are really surface-protection problems. This cluster groups high-risk problems where the process must protect the finish while solving the visible issue.",
    problemCategories: ["physical_damage", "transfer"],
    guideSlugs: ["when-cleaning-damages-surfaces", "why-cleaning-fails"],
  },
  {
    type: "method_family",
    slug: "low-residue-maintenance-methods",
    title: "Low-residue maintenance methods",
    description:
      "A cluster focused on maintenance-oriented methods that prioritize safe routine cleaning, lower residue risk, and controlled finish preservation.",
    intro:
      "Not every cleaning decision should start with aggressive chemistry or escalation. This cluster groups routine-maintenance methods that emphasize compatibility, repeatability, and finish control.",
    methodSlugs: ["neutral-surface-cleaning", "glass-cleaning"],
    guideSlugs: ["why-cleaning-fails", "when-cleaning-damages-surfaces"],
  },
  {
    type: "method_family",
    slug: "targeted-removal-methods",
    title: "Targeted removal methods",
    description:
      "A cluster focused on methods used when buildup, deposits, or contamination require more specialized treatment than routine maintenance.",
    intro:
      "Some methods are designed for specific contamination patterns rather than broad maintenance. This cluster groups targeted removal methods and the surfaces and problems they most often connect to.",
    methodSlugs: ["degreasing", "hard-water-deposit-removal", "touchpoint-sanitization"],
    guideSlugs: [
      "how-to-remove-stains-safely",
      "why-cleaning-fails",
      "when-cleaning-damages-surfaces",
    ],
  },
  {
    type: "surface_risk",
    slug: "high-visibility-finish-sensitive-surfaces",
    title: "High-visibility finish-sensitive surfaces",
    description:
      "A cluster focused on surfaces where streaking, haze, scratching, or finish disruption are highly visible and process control matters more.",
    intro:
      "Some surfaces make mistakes obvious. This cluster groups surfaces where finish quality, residue control, and controlled method selection are especially important.",
    surfaceSlugs: ["shower-glass", "stainless-steel", "granite-countertops"],
    guideSlugs: ["when-cleaning-damages-surfaces", "how-to-remove-stains-safely"],
  },
  {
    type: "surface_risk",
    slug: "high-contact-and-high-traffic-surfaces",
    title: "High-contact and high-traffic surfaces",
    description:
      "A cluster focused on surfaces where repeated use, touch frequency, or traffic patterns shape the cleaning risk and maintenance strategy.",
    intro:
      "Some surfaces are challenging because they are touched or used constantly, not because they are chemically delicate. This cluster groups surfaces where contamination reappears quickly and consistency matters.",
    surfaceSlugs: ["tile", "painted-walls", "stainless-steel"],
    guideSlugs: ["why-cleaning-fails"],
  },
];
