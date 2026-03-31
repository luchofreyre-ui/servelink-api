import { describe, expect, it } from "vitest";

import {
  buildRelatedTopicsMarkdownSection,
  escapeMarkdownLinkText,
  getInternalLinkRecommendations,
  INTERNAL_LINK_RECOMMENDATION_LIMIT,
  INTERNAL_LINK_REASON_SCORES,
} from "./internalLinkRecommendations";
import type { EncyclopediaCorpusEntry } from "./loadEncyclopediaIndexEntries";

function row(
  partial: Partial<EncyclopediaCorpusEntry> & Pick<EncyclopediaCorpusEntry, "slug" | "cluster" | "category">,
): EncyclopediaCorpusEntry {
  return {
    id: partial.id ?? partial.slug.toUpperCase(),
    slug: partial.slug,
    title: partial.title ?? partial.slug,
    category: partial.category,
    cluster: partial.cluster,
    role: partial.role ?? "supporting",
    status: partial.status ?? "published",
    href: partial.href ?? `/encyclopedia/${partial.category}/${partial.slug}`,
    fileExists: true,
  };
}

describe("internalLinkRecommendations", () => {
  const corpus: EncyclopediaCorpusEntry[] = [
    row({ slug: "dust-buildup-on-glass", cluster: "dust-buildup", category: "problems" }),
    row({ slug: "dust-buildup-on-grout", cluster: "dust-buildup", category: "problems" }),
    row({ slug: "grease-buildup-on-glass", cluster: "oil", category: "problems" }),
    row({ slug: "degreasing-glass", cluster: "degreasing", category: "methods" }),
    row({ slug: "neutral-cleaning-glass", cluster: "neutral-cleaning", category: "methods" }),
    row({ slug: "why-streaks", cluster: "dust-buildup", category: "problems" }),
    row({ slug: "soap-vs-hard-water", cluster: "mineral", category: "problems" }),
  ];

  it("same-cluster targets rank above unrelated cluster", () => {
    const r = getInternalLinkRecommendations("dust-buildup-on-glass", corpus);
    const top = r.recommendations[0];
    expect(top).toBeDefined();
    expect(["dust-buildup-on-grout", "why-streaks"]).toContain(top!.slug);
    expect(top!.score).toBeGreaterThanOrEqual(INTERNAL_LINK_REASON_SCORES.same_cluster);
  });

  it("same-surface recommendations appear when tail matches", () => {
    const r = getInternalLinkRecommendations("dust-buildup-on-glass", corpus);
    const glass = r.recommendations.filter((x) => x.slug === "grease-buildup-on-glass");
    expect(glass.length).toBe(1);
    expect(glass[0].reason).toBe("same_surface");
  });

  it("excludes self slug", () => {
    const r = getInternalLinkRecommendations("dust-buildup-on-glass", corpus);
    expect(r.recommendations.some((x) => x.slug === "dust-buildup-on-glass")).toBe(false);
  });

  it("dedupes by slug", () => {
    const r = getInternalLinkRecommendations("dust-buildup-on-glass", corpus);
    const slugs = r.recommendations.map((x) => x.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("caps at top N", () => {
    const big: EncyclopediaCorpusEntry[] = [
      row({ slug: "src", cluster: "c", category: "problems" }),
      ...Array.from({ length: 30 }, (_, i) =>
        row({ slug: `peer-${i}-on-glass`, cluster: "c", category: "problems" }),
      ),
    ];
    const r = getInternalLinkRecommendations("src", big, { limit: INTERNAL_LINK_RECOMMENDATION_LIMIT });
    expect(r.recommendations.length).toBeLessThanOrEqual(INTERNAL_LINK_RECOMMENDATION_LIMIT);
  });

  it("returns empty when slug missing", () => {
    const r = getInternalLinkRecommendations("nope", corpus);
    expect(r.recommendations).toEqual([]);
  });

  it("does not treat generic method tails like removal as a shared surface", () => {
    const rows: EncyclopediaCorpusEntry[] = [
      row({ slug: "soap-scum-removal", cluster: "soap-scum", category: "methods" }),
      row({ slug: "hard-water-deposit-removal", cluster: "mineral", category: "methods" }),
    ];
    const r = getInternalLinkRecommendations("soap-scum-removal", rows);
    expect(r.recommendations).toEqual([]);
  });

  it("deterministic order for equal scores", () => {
    const a = getInternalLinkRecommendations("dust-buildup-on-glass", corpus);
    const b = getInternalLinkRecommendations("dust-buildup-on-glass", corpus);
    expect(a.recommendations.map((x) => x.slug)).toEqual(b.recommendations.map((x) => x.slug));
  });

  it("buildRelatedTopicsMarkdownSection appends heading and markdown links", () => {
    const md = buildRelatedTopicsMarkdownSection("dust-buildup-on-glass", corpus);
    expect(md).toContain("## Related Topics");
    expect(md).toContain("/encyclopedia/");
    expect(md).toMatch(/^[\s\S]*\[[^\]]+\]\([^)]+\)[\s\S]*$/);
  });

  it("escapeMarkdownLinkText escapes brackets", () => {
    expect(escapeMarkdownLinkText("A [test]")).toBe("A \\[test\\]");
  });
});
