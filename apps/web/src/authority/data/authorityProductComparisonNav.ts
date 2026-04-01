/** Extra internal links for product comparison pages (SEO loop: problem ↔ surface playbook ↔ products). */

export type ProductComparisonNavExtras = {
  problemSlugs: string[];
  surfaceProblemCombos: { surfaceSlug: string; problemSlug: string }[];
};

const EXTRA: Record<string, ProductComparisonNavExtras> = {
  "clr-calcium-lime-rust-vs-lime-a-way-cleaner": {
    problemSlugs: ["hard-water-deposits"],
    surfaceProblemCombos: [{ surfaceSlug: "shower-glass", problemSlug: "hard-water-deposits" }],
  },
  "dawn-platinum-dish-spray-vs-krud-kutter-kitchen-degreaser": {
    problemSlugs: ["grease-buildup"],
    surfaceProblemCombos: [
      { surfaceSlug: "stainless-steel", problemSlug: "grease-buildup" },
      { surfaceSlug: "tile", problemSlug: "grease-buildup" },
    ],
  },
  "goo-gone-original-liquid-vs-goof-off-professional-strength-remover": {
    problemSlugs: ["adhesive-residue"],
    surfaceProblemCombos: [{ surfaceSlug: "laminate", problemSlug: "adhesive-residue" }],
  },
};

export function getProductComparisonNavExtras(comparisonSlug: string): ProductComparisonNavExtras | null {
  return EXTRA[comparisonSlug] ?? null;
}
