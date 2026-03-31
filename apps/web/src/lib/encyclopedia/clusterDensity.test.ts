import { describe, expect, it } from "vitest";

import {
  buildClusterDensityReport,
  classifyClusterDensityStatus,
  computeMissingArchetypes,
  sampleSlugsForCluster,
} from "./clusterDensity";
import type { EncyclopediaCorpusEntry } from "./loadEncyclopediaIndexEntries";

function e(partial: Partial<EncyclopediaCorpusEntry> & Pick<EncyclopediaCorpusEntry, "slug" | "cluster">): EncyclopediaCorpusEntry {
  const cat = partial.category ?? "problems";
  const base: EncyclopediaCorpusEntry = {
    id: partial.id ?? "ID",
    slug: partial.slug,
    title: partial.title ?? "T",
    category: cat,
    cluster: partial.cluster,
    role: partial.role ?? "supporting",
    status: partial.status ?? "published",
    href: partial.href ?? `/encyclopedia/${cat}/${partial.slug}`,
    fileExists: partial.fileExists ?? true,
  };
  return { ...base, ...partial };
}

describe("clusterDensity", () => {
  it("bucket counts overlap archetypes (total is page count)", () => {
    const entries = [
      e({ slug: "a-on-glass", cluster: "c1", category: "problems" }),
      e({ slug: "b-on-glass", cluster: "c1", category: "methods" }),
      e({ slug: "tile", cluster: "c1", category: "surfaces" }),
      e({ slug: "why-x", cluster: "c1", category: "problems" }),
      e({ slug: "p-vs-q", cluster: "c1", category: "problems" }),
    ];
    const report = buildClusterDensityReport(entries, "t");
    const row = report.rows.find((r) => r.clusterSlug === "c1");
    expect(row).toBeDefined();
    expect(row!.counts.total).toBe(5);
    expect(row!.counts.problems).toBe(3);
    expect(row!.counts.methods).toBe(1);
    expect(row!.counts.surfaces).toBe(1);
    expect(row!.counts.questions).toBe(1);
    expect(row!.counts.comparisons).toBe(1);
  });

  it("missing archetype flags", () => {
    const counts = {
      problems: 2,
      methods: 0,
      surfaces: 0,
      questions: 0,
      comparisons: 0,
      guides: 0,
      total: 2,
    };
    const clusterEntries = [
      e({ slug: "x", cluster: "k" }),
      e({ slug: "y", cluster: "k" }),
    ];
    const m = computeMissingArchetypes(counts, clusterEntries);
    expect(m.hasProblemPages).toBe(true);
    expect(m.hasMethodPages).toBe(false);
    expect(m.hasSurfaceCoverage).toBe(false);
  });

  it("hasSurfaceCoverage from -on- slug", () => {
    const counts = { problems: 1, methods: 0, surfaces: 0, questions: 0, comparisons: 0, guides: 0, total: 1 };
    const m = computeMissingArchetypes(counts, [e({ slug: "dust-on-glass", cluster: "x" })]);
    expect(m.hasSurfaceCoverage).toBe(true);
  });

  it("classify thin when total < 5", () => {
    expect(
      classifyClusterDensityStatus({
        problems: 2,
        methods: 2,
        surfaces: 0,
        questions: 0,
        comparisons: 0,
        guides: 0,
        total: 4,
      }),
    ).toBe("thin");
  });

  it("classify thin when no problems and no methods", () => {
    expect(
      classifyClusterDensityStatus({
        problems: 0,
        methods: 0,
        surfaces: 6,
        questions: 0,
        comparisons: 0,
        guides: 0,
        total: 6,
      }),
    ).toBe("thin");
  });

  it("classify dense when thresholds met", () => {
    expect(
      classifyClusterDensityStatus({
        problems: 4,
        methods: 8,
        surfaces: 0,
        questions: 1,
        comparisons: 0,
        guides: 0,
        total: 12,
      }),
    ).toBe("dense");
  });

  it("classify developing between thin and dense", () => {
    expect(
      classifyClusterDensityStatus({
        problems: 3,
        methods: 3,
        surfaces: 0,
        questions: 0,
        comparisons: 0,
        guides: 0,
        total: 6,
      }),
    ).toBe("developing");
  });

  it("sampleSlugs returns sorted slice", () => {
    const entries = [
      e({ slug: "z", cluster: "c" }),
      e({ slug: "a", cluster: "c" }),
      e({ slug: "m", cluster: "c" }),
    ];
    expect(sampleSlugsForCluster(entries, 2)).toEqual(["a", "m"]);
  });
});
