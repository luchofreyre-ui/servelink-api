import { describe, expect, it } from "vitest";
import {
  getAllComparisonSeeds,
  getComparisonSeedBySlug,
  normalizeComparisonSlug,
} from "../authorityComparisonSelectors";

describe("authorityComparisonSelectors", () => {
  it("normalizes comparison slugs", () => {
    expect(normalizeComparisonSlug("zeta", "alpha")).toBe("alpha-vs-zeta");
  });

  it("returns comparison seeds", () => {
    const seeds = getAllComparisonSeeds();
    expect(seeds.length).toBeGreaterThan(0);
  });

  it("finds method comparison by slug", () => {
    const slug = normalizeComparisonSlug("degreasing", "neutral-surface-cleaning");
    const seed = getComparisonSeedBySlug("method_comparison", slug);
    expect(seed).not.toBeNull();
  });
});
