import { describe, expect, it } from "vitest";

import {
  buildClusterGapBackfillPayload,
  computeClusterGapPriority,
  type ClusterGapExpansionPools,
} from "./clusterGapBackfill";
import type { EncyclopediaCorpusEntry } from "./loadEncyclopediaIndexEntries";
import { buildMasterIndexLookupFromEntries } from "./masterIndexLookup";

function corpusRow(
  partial: Partial<EncyclopediaCorpusEntry> & Pick<EncyclopediaCorpusEntry, "slug" | "cluster" | "category">,
): EncyclopediaCorpusEntry {
  const cat = partial.category;
  return {
    id: partial.id ?? partial.slug.toUpperCase(),
    slug: partial.slug,
    title: partial.title ?? partial.slug,
    category: cat,
    cluster: partial.cluster,
    role: partial.role ?? "supporting",
    status: partial.status ?? "published",
    href: partial.href ?? `/encyclopedia/${cat}/${partial.slug}`,
    fileExists: true,
  };
}

const miniPools: ClusterGapExpansionPools = {
  problems: [{ slug: "dust-buildup", title: "Dust Buildup", cluster: "dust-buildup" }],
  methods: [{ slug: "dry-dust-removal", title: "Dry Dust Removal", cluster: "dust-buildup" }],
  surfaces: [{ slug: "shower-glass" }, { slug: "grout" }, { slug: "tile" }],
};

describe("clusterGapBackfill", () => {
  it("computeClusterGapPriority matches thin/developing weights", () => {
    const thinMissing = {
      hasProblemPages: false,
      hasMethodPages: false,
      hasQuestionPages: false,
      hasComparisonPages: false,
      hasSurfaceCoverage: false,
    };
    expect(computeClusterGapPriority("thin", thinMissing)).toBeGreaterThan(
      computeClusterGapPriority("developing", {
        hasProblemPages: true,
        hasMethodPages: true,
        hasQuestionPages: true,
        hasComparisonPages: true,
        hasSurfaceCoverage: true,
      }),
    );
  });

  it("thin cluster produces problem, method, and question candidates", () => {
    const entries = [
      corpusRow({ slug: "a", cluster: "tiny", category: "problems" }),
      corpusRow({ slug: "b", cluster: "tiny", category: "problems" }),
    ];
    const pools: ClusterGapExpansionPools = {
      problems: [{ slug: "tiny-prob", title: "Tiny Prob", cluster: "tiny" }],
      methods: [{ slug: "tiny-met", title: "Tiny Met", cluster: "tiny" }],
      surfaces: [{ slug: "tile" }, { slug: "grout" }],
    };
    const existing = new Set(entries.map((e) => e.slug));
    const payload = buildClusterGapBackfillPayload(entries, pools, existing, { guardRules: [] });
    const tiny = payload.clusters.find((c) => c.clusterSlug === "tiny");
    expect(tiny?.status).toBe("thin");
    expect(tiny?.candidatesAdded).toBeGreaterThan(0);
    const families = new Set(payload.candidates.map((c) => c.sourceFamily));
    expect(families.has("gap_backfill_problem_surface")).toBe(true);
    expect(families.has("gap_backfill_method_surface")).toBe(true);
    expect(families.has("question_symptom_cause") || families.has("question_prevention_troubleshooting")).toBe(
      true,
    );
  });

  it("developing cluster missing methods only adds method_surface rows", () => {
    const entries = Array.from({ length: 6 }, (_, i) =>
      corpusRow({
        slug: `p-${i}-on-tile`,
        cluster: "mid",
        category: "problems",
      }),
    );
    const pools: ClusterGapExpansionPools = {
      problems: [{ slug: "mid", title: "Mid", cluster: "mid" }],
      methods: [{ slug: "mid-method", title: "Mid Method", cluster: "mid" }],
      surfaces: [{ slug: "tile" }],
    };
    const existing = new Set(entries.map((e) => e.slug));
    const payload = buildClusterGapBackfillPayload(entries, pools, existing, { guardRules: [] });
    const mid = payload.clusters.find((c) => c.clusterSlug === "mid");
    expect(mid?.status).toBe("developing");
    const added = payload.candidates.filter((c) => c.sourceParts.gapBackfill === true && c.cluster === "mid");
    expect(added.some((c) => c.generatedType === "method_surface")).toBe(true);
    expect(added.some((c) => c.generatedType === "problem_surface")).toBe(false);
    expect(added.some((c) => c.generatedType === "question_seed")).toBe(true);
  });

  it("skips weak material × surface pairs (e.g. glass cluster anchor on laminate)", () => {
    const entries = [corpusRow({ slug: "g1", cluster: "glass", category: "problems" })];
    const pools: ClusterGapExpansionPools = {
      problems: [{ slug: "glass", title: "Glass", cluster: "glass" }],
      methods: [{ slug: "glass", title: "Glass", cluster: "glass" }],
      surfaces: [{ slug: "laminate" }, { slug: "tile-floors" }],
    };
    const payload = buildClusterGapBackfillPayload(entries, pools, new Set(), { guardRules: [] });
    expect(payload.candidates.some((c) => c.slug.includes("laminate"))).toBe(false);
  });

  it("dense cluster adds no candidates", () => {
    const entries: EncyclopediaCorpusEntry[] = [];
    for (let i = 0; i < 6; i += 1) {
      entries.push(corpusRow({ slug: `pr-${i}`, cluster: "fat", category: "problems" }));
    }
    for (let i = 0; i < 6; i += 1) {
      entries.push(corpusRow({ slug: `mt-${i}`, cluster: "fat", category: "methods" }));
    }
    entries.push(corpusRow({ slug: "why-fat", cluster: "fat", category: "problems" }));
    entries.push(corpusRow({ slug: "a-vs-b", cluster: "fat", category: "problems" }));
    const pools = miniPools;
    const existing = new Set(entries.map((e) => e.slug));
    const payload = buildClusterGapBackfillPayload(entries, pools, existing, { guardRules: [] });
    const fat = payload.clusters.find((c) => c.clusterSlug === "fat");
    expect(fat?.status).toBe("dense");
    expect(fat?.candidatesAdded).toBe(0);
    expect(fat?.suppressedByMasterIndex).toBe(0);
  });

  it("suppresses problem × surface when final slug exists in master (normalized surface, alias input)", () => {
    const entries = [
      corpusRow({ slug: "a", cluster: "deg", category: "problems" }),
      corpusRow({ slug: "b", cluster: "deg", category: "problems" }),
    ];
    const pools: ClusterGapExpansionPools = {
      problems: [{ slug: "degreasing", title: "Degreasing", cluster: "deg" }],
      methods: [{ slug: "degreasing", title: "Degreasing", cluster: "deg" }],
      /** Single surface so thin-cluster caps cannot skip tile normalization. */
      surfaces: [{ slug: "cleaning-tile-floors" }],
    };
    const masterLookup = buildMasterIndexLookupFromEntries([
      { id: "OTHER", slug: "degreasing-on-tile-floors" },
    ]);
    const payload = buildClusterGapBackfillPayload(entries, pools, new Set(), {
      guardRules: [],
      masterLookup,
    });
    expect(payload.candidates.some((c) => c.slug === "degreasing-on-tile-floors")).toBe(false);
    expect(payload.masterIndexSuppressedCount).toBeGreaterThanOrEqual(1);
    const deg = payload.clusters.find((c) => c.clusterSlug === "deg");
    expect((deg?.suppressedByMasterIndex ?? 0) >= 1).toBe(true);
  });

  it("suppresses when GAP id exists in master even if slug differs", () => {
    const entries = [
      corpusRow({ slug: "a", cluster: "deg", category: "problems" }),
      corpusRow({ slug: "b", cluster: "deg", category: "problems" }),
    ];
    const pools: ClusterGapExpansionPools = {
      problems: [{ slug: "degreasing", title: "Degreasing", cluster: "deg" }],
      methods: [{ slug: "degreasing", title: "Degreasing", cluster: "deg" }],
      surfaces: [{ slug: "tile" }],
    };
    const masterLookup = buildMasterIndexLookupFromEntries([
      { id: "GAP-P-DEGREASING-ON-TILE-FLOORS", slug: "legacy-unrelated-slug" },
    ]);
    const payload = buildClusterGapBackfillPayload(entries, pools, new Set(), {
      guardRules: [],
      masterLookup,
    });
    expect(payload.candidates.some((c) => c.id === "GAP-P-DEGREASING-ON-TILE-FLOORS")).toBe(false);
    expect(payload.masterIndexSuppressedCount).toBeGreaterThanOrEqual(1);
  });

  it("emits problem × surface when id and slug are absent from master", () => {
    const entries = [
      corpusRow({ slug: "a", cluster: "deg", category: "problems" }),
      corpusRow({ slug: "b", cluster: "deg", category: "problems" }),
    ];
    const pools: ClusterGapExpansionPools = {
      problems: [{ slug: "degreasing", title: "Degreasing", cluster: "deg" }],
      methods: [{ slug: "degreasing", title: "Degreasing", cluster: "deg" }],
      surfaces: [{ slug: "tile" }],
    };
    const masterLookup = buildMasterIndexLookupFromEntries([{ id: "OTHER", slug: "other-on-tile" }]);
    const payload = buildClusterGapBackfillPayload(entries, pools, new Set(), {
      guardRules: [],
      masterLookup,
    });
    expect(payload.candidates.some((c) => c.slug === "degreasing-on-tile-floors")).toBe(true);
  });

  it("masterIndexSuppressedCount matches per-cluster suppressedByMasterIndex sum", () => {
    const entries = [
      corpusRow({ slug: "a", cluster: "deg", category: "problems" }),
      corpusRow({ slug: "b", cluster: "deg", category: "problems" }),
    ];
    const pools: ClusterGapExpansionPools = {
      problems: [{ slug: "degreasing", title: "Degreasing", cluster: "deg" }],
      methods: [{ slug: "degreasing", title: "Degreasing", cluster: "deg" }],
      surfaces: [{ slug: "tile" }],
    };
    const masterLookup = buildMasterIndexLookupFromEntries([
      { id: "X", slug: "degreasing-on-tile-floors" },
      { id: "Y", slug: "degreasing-tile-floors" },
    ]);
    const payload = buildClusterGapBackfillPayload(entries, pools, new Set(), {
      guardRules: [],
      masterLookup,
    });
    const sum = payload.clusters.reduce((acc, c) => acc + c.suppressedByMasterIndex, 0);
    expect(sum).toBe(payload.masterIndexSuppressedCount);
  });
});
