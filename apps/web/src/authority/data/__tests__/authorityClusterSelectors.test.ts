import { describe, expect, it } from "vitest";
import {
  getAllClusterSeeds,
  getClusterSeedBySlug,
  getMethodSlugsForCluster,
  getProblemSlugsForCluster,
  getSurfaceSlugsForCluster,
} from "../authorityClusterSelectors";

describe("authorityClusterSelectors", () => {
  it("returns cluster seeds", () => {
    const seeds = getAllClusterSeeds();
    expect(seeds.length).toBeGreaterThan(0);
  });

  it("finds a cluster by slug", () => {
    const seed = getClusterSeedBySlug("mineral-buildup-and-hard-water");
    expect(seed).not.toBeNull();
  });

  it("returns problems for a problem-category cluster", () => {
    const seed = getClusterSeedBySlug("mineral-buildup-and-hard-water");
    expect(seed).not.toBeNull();
    const slugs = getProblemSlugsForCluster(seed!);
    expect(slugs.length).toBeGreaterThan(0);
  });

  it("returns methods for a method-family cluster", () => {
    const seed = getClusterSeedBySlug("targeted-removal-methods");
    expect(seed).not.toBeNull();
    const slugs = getMethodSlugsForCluster(seed!);
    expect(slugs.length).toBeGreaterThan(0);
  });

  it("returns surfaces for a surface-risk cluster", () => {
    const seed = getClusterSeedBySlug("high-visibility-finish-sensitive-surfaces");
    expect(seed).not.toBeNull();
    const slugs = getSurfaceSlugsForCluster(seed!);
    expect(slugs.length).toBeGreaterThan(0);
  });
});
