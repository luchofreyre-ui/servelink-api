// problemScoring.ts

export type ProblemScore = {
  score: number;
  reasons: string[];
};

const CORE_PROBLEMS = new Set([
  "hard water stains",
  "soap scum",
  "grease buildup",
  "streaking",
  "residue buildup",
  "haze",
  "discoloration",
  "limescale",
]);

const WEAK_PROBLEMS = new Set([
  "marks",
  "issues",
  "smearing",
]);

const CONTEXTUAL_OK = new Set([
  "smearing",
  "residue",
  "film",
]);

export function scoreProblem(problem: string): ProblemScore {
  const p = problem.toLowerCase().trim();
  let score = 0;
  const reasons: string[] = [];

  if (CORE_PROBLEMS.has(p)) {
    score += 0.9;
    reasons.push("core problem");
  }

  if (p.includes("buildup") || p.includes("stains") || p.includes("scum")) {
    score += 0.2;
    reasons.push("specific physical issue");
  }

  if (WEAK_PROBLEMS.has(p)) {
    score -= 0.5;
    reasons.push("too vague");
  }

  if (p.length > 12) {
    score += 0.1;
    reasons.push("more descriptive");
  }

  score = Math.max(0, Math.min(1, score));

  return { score, reasons };
}

// Require qualifiers for weak problems
export function requiresQualifier(problem: string): boolean {
  return CONTEXTUAL_OK.has(problem.toLowerCase().trim());
}

// Validate if problem is usable
export function isProblemValid(problem: string): boolean {
  const { score } = scoreProblem(problem);

  if (score >= 0.7) return true;

  if (requiresQualifier(problem)) return true;

  return false;
}

export function shouldGenerate(problem: string): boolean {
  const normalized = problem.toLowerCase().trim();

  const { score } = scoreProblem(normalized);

  // Hard cutoff
  if (score < 0.6) return false;

  return true;
}
