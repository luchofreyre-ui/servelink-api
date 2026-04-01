const PROBLEM_CLUSTERS: Record<string, string[]> = {
  "sticky residue": ["grease buildup", "soap scum"],
  discoloration: ["mineral deposits", "hard water film"],
  biofilm: ["mold", "biological growth"],
};

export function getRelatedProblems(problem: string) {
  return PROBLEM_CLUSTERS[problem] || [];
}

