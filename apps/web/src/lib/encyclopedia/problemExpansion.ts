// problemExpansion.ts

type ExpansionRule = {
  base: string;
  variants: string[];
};

const EXPANSION_RULES: ExpansionRule[] = [
  {
    base: "smearing",
    variants: [
      "glass cleaner smearing",
      "product residue smearing",
      "improper drying smearing",
    ],
  },
  {
    base: "residue",
    variants: [
      "cleaning product residue",
      "detergent residue",
      "soap residue",
    ],
  },
  {
    base: "haze",
    variants: [
      "cleaning product haze",
      "hard water haze",
      "improper drying haze",
    ],
  },
];

export function expandProblem(problem: string): string[] {
  const normalized = problem.toLowerCase().trim();

  const match = EXPANSION_RULES.find((r) => r.base === normalized);

  if (!match) return [problem];

  return match.variants;
}
