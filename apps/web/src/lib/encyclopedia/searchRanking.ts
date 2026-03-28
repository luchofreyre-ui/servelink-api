import type { EncyclopediaCategory, EncyclopediaResolvedIndexEntry } from "./types";

export type SearchRankingContext = {
  query: string;
  intent: "problem" | "method" | "surface" | "unknown";
};

type RankingBucket = "problem" | "method" | "surface" | "other";

function toRankingBucket(category: EncyclopediaCategory): RankingBucket {
  if (category === "problems") return "problem";
  if (category === "methods") return "method";
  if (category === "surfaces") return "surface";
  return "other";
}

export function rankEncyclopediaResults(
  entries: EncyclopediaResolvedIndexEntry[],
  context: SearchRankingContext,
) {
  return entries
    .map((entry) => ({
      entry,
      score: computeScore(entry, context),
    }))
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entry);
}

function computeScore(
  entry: EncyclopediaResolvedIndexEntry,
  context: SearchRankingContext,
) {
  let score = 0;

  // 1. CATEGORY PRIORITY (MOST IMPORTANT)
  score += getCategoryScore(entry.category, context.intent);

  // 2. CLUSTER ALIGNMENT
  if (matchesCluster(entry, context.query)) score += 30;

  // 3. CORE VS VARIANT
  if (entry.role === "core") score += 40;
  if (entry.role === "supporting") score -= 15;

  // 4. SLUG STRENGTH
  if (slugMatchesQuery(entry.slug, context.query)) score += 25;

  // 5. TITLE MATCH
  if (titleMatchesQuery(entry.title, context.query)) score += 20;

  // 6. INTERNAL GRAPH SIGNALS (enhance over time)
  if (entry.isFeaturedInCluster) score += 35;
  if (entry.isInCluster) score += 15;
  const links = entry.incomingLinks ?? 0;
  if (links > 0) {
    score += Math.min(36, links * 3);
  }

  return score;
}

// -----------------------------

function getCategoryScore(
  category: EncyclopediaCategory,
  intent: SearchRankingContext["intent"],
) {
  const bucket = toRankingBucket(category);

  if (intent === "problem") {
    if (bucket === "problem") return 120;
    if (bucket === "method") return 60;
    if (bucket === "surface") return 40;
    return 25;
  }

  if (intent === "method") {
    if (bucket === "method") return 100;
    if (bucket === "problem") return 70;
    if (bucket === "surface") return 40;
    return 25;
  }

  if (intent === "surface") {
    if (bucket === "surface") return 100;
    if (bucket === "problem") return 60;
    if (bucket === "method") return 40;
    return 25;
  }

  // fallback (unknown intent)
  if (bucket === "problem") return 80;
  if (bucket === "method") return 60;
  if (bucket === "surface") return 50;
  return 25;
}

function matchesCluster(entry: EncyclopediaResolvedIndexEntry, query: string) {
  const q = query.toLowerCase().trim();
  const cluster = entry.cluster.toLowerCase();
  if (!cluster) return false;
  if (q.includes(cluster)) return true;
  const tokens = cluster.split("-").filter((t) => t.length >= 3);
  if (tokens.length === 0) return false;
  return tokens.some((t) => q.includes(t));
}

function slugMatchesQuery(slug: string, query: string) {
  const s = slug.toLowerCase();
  const parts = query
    .toLowerCase()
    .split(/\s+/)
    .map((x) => x.replace(/[^a-z0-9-]/g, ""))
    .filter((x) => x.length > 1);
  return parts.some((q) => q.length > 0 && s.includes(q));
}

function titleMatchesQuery(title: string, query: string) {
  return query.split(/\s+/).some((q) => {
    const t = q.trim();
    if (t.length < 2) return false;
    return title.toLowerCase().includes(t.toLowerCase());
  });
}
