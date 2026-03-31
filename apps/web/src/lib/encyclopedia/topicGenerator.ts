import { scoreGeneratedCandidate } from "./candidateScoring";
import { cleanupSurfaceTaxonomy } from "./taxonomyCleanup";
import { getResolvedEncyclopediaIndex } from "./loader";
import type { EncyclopediaResolvedIndexEntry } from "./types";

export type GeneratedIndexCandidate = {
  id: string;
  slug: string;
  title: string;
  category: "problems" | "methods";
  cluster: string;
  role: "supporting";
  status: "draft";
  generatedType: "problem_surface" | "method_surface" | "problem_method";
  cleanedTitle?: string;
  cleanedSlug?: string;
  qualityScore?: number;
  qualityFlags?: string[];
  recommendation?: "promote" | "review" | "reject";
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getExistingEntries(): EncyclopediaResolvedIndexEntry[] {
  return getResolvedEncyclopediaIndex();
}

function makeId(prefix: string, slug: string) {
  return `${prefix}-GEN-${slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
}

export function buildGeneratedIndexCandidates() {
  const entries = getExistingEntries();

  const problems = entries.filter((e) => e.category === "problems");
  const surfaces = entries.filter((e) => e.category === "surfaces");
  const methods = entries.filter((e) => e.category === "methods");

  const existingSlugs = new Set(entries.map((e) => e.slug));
  const generated = new Set<string>();

  const results: GeneratedIndexCandidate[] = [];

  const push = (item: GeneratedIndexCandidate) => {
    const dedupeKey = item.cleanedSlug ?? item.slug;
    if (existingSlugs.has(dedupeKey)) return;
    if (generated.has(dedupeKey)) return;
    generated.add(dedupeKey);
    results.push(item);
  };

  // Problem × Surface (MAIN ENGINE)
  for (const problem of problems.slice(0, 20)) {
    for (const surface of surfaces.slice(0, 10)) {
      const cleanedSurface = cleanupSurfaceTaxonomy(surface.slug);
      const cleanedSlug = `${slugify(problem.slug)}-on-${cleanedSurface.normalizedSurfaceSlug}`;
      const cleanedTitle = `${problem.title} on ${cleanedSurface.normalizedSurfaceLabel}`;
      const scored = scoreGeneratedCandidate({
        title: cleanedTitle,
        slug: cleanedSlug,
        generatedType: "problem_surface",
      });

      push({
        id: makeId("P", cleanedSlug),
        slug: cleanedSlug,
        title: cleanedTitle,
        category: "problems",
        cluster: problem.cluster,
        role: "supporting",
        status: "draft",
        generatedType: "problem_surface",
        cleanedSlug,
        cleanedTitle,
        qualityScore: scored.score,
        qualityFlags: scored.flags,
        recommendation: scored.recommendation,
      });
    }
  }

  // Method × Surface
  for (const method of methods.slice(0, 10)) {
    for (const surface of surfaces.slice(0, 10)) {
      const cleanedSurface = cleanupSurfaceTaxonomy(surface.slug);
      const cleanedSlug = `${slugify(method.slug)}-${cleanedSurface.normalizedSurfaceSlug}`;
      const cleanedTitle = `${method.title} for ${cleanedSurface.normalizedSurfaceLabel}`;
      const scored = scoreGeneratedCandidate({
        title: cleanedTitle,
        slug: cleanedSlug,
        generatedType: "method_surface",
      });

      push({
        id: makeId("M", cleanedSlug),
        slug: cleanedSlug,
        title: cleanedTitle,
        category: "methods",
        cluster: method.cluster,
        role: "supporting",
        status: "draft",
        generatedType: "method_surface",
        cleanedSlug,
        cleanedTitle,
        qualityScore: scored.score,
        qualityFlags: scored.flags,
        recommendation: scored.recommendation,
      });
    }
  }

  return results.sort((a, b) => a.slug.localeCompare(b.slug));
}
