// contentRules.ts

export function isWaterBased(problem: string): boolean {
  return (
    problem.includes("hard water") ||
    problem.includes("limescale") ||
    problem.includes("soap scum")
  );
}

export function isGreaseBased(problem: string): boolean {
  return problem.includes("grease");
}

export function isResidueBased(problem: string): boolean {
  return (
    problem.includes("residue") ||
    problem.includes("haze") ||
    problem.includes("film")
  );
}
