import { describe, expect, it } from "vitest";
import { AUTHORITY_SURFACE_SLUGS } from "../authorityTaxonomy";
import type { AuthoritySurfaceSlug } from "../authorityTaxonomy";
import {
  AUTHORITY_SURFACE_SCIENCE_PROFILES,
  getSurfaceScienceProfile,
} from "../authoritySurfaceScienceModel";
import { getAllSurfacePages, getSurfacePageBySlug } from "../authoritySurfacePageData";

const REQUIRED_SECTIONS = [
  "material",
  "finish",
  "porosity",
  "moistureTolerance",
  "abrasionTolerance",
  "chemicalSensitivity",
  "coatingSealer",
  "restorationBoundary",
  "prevention",
] as const;

function expectNonEmpty(value: string | string[]): void {
  if (Array.isArray(value)) {
    expect(value.length).toBeGreaterThan(0);
    for (const item of value) {
      expect(item.trim().length).toBeGreaterThan(0);
    }
    return;
  }

  expect(value.trim().length).toBeGreaterThan(0);
}

describe("authority surface science model", () => {
  it("provides a complete science profile for every authority surface", () => {
    expect(Object.keys(AUTHORITY_SURFACE_SCIENCE_PROFILES).sort()).toEqual([...AUTHORITY_SURFACE_SLUGS].sort());

    for (const slug of AUTHORITY_SURFACE_SLUGS) {
      const profile = getSurfaceScienceProfile(slug);

      for (const section of REQUIRED_SECTIONS) {
        expect(profile[section], `${slug} missing ${section}`).toBeDefined();
      }

      expectNonEmpty(profile.material.identity);
      expectNonEmpty(profile.material.behavior);
      expectNonEmpty(profile.finish.families);
      expectNonEmpty(profile.finish.identity);
      expectNonEmpty(profile.finish.behavior);
      expectNonEmpty(profile.porosity.behavior);
      expectNonEmpty(profile.porosity.absorptionRisk);
      expectNonEmpty(profile.moistureTolerance.risks);
      expectNonEmpty(profile.moistureTolerance.controlStrategy);
      expectNonEmpty(profile.abrasionTolerance.risks);
      expectNonEmpty(profile.abrasionTolerance.controlStrategy);
      expectNonEmpty(profile.chemicalSensitivity.sensitiveTo);
      expectNonEmpty(profile.chemicalSensitivity.controlStrategy);
      expectNonEmpty(profile.coatingSealer.risks);
      expectNonEmpty(profile.coatingSealer.controlStrategy);
      expectNonEmpty(profile.restorationBoundary.restorableConditions);
      expectNonEmpty(profile.restorationBoundary.limits);
      expectNonEmpty(profile.restorationBoundary.escalationSignals);
      expectNonEmpty(profile.prevention.strategies);
      expectNonEmpty(profile.prevention.inspectionCues);
    }
  });

  it("attaches science profiles to every authority surface page", () => {
    const pages = getAllSurfacePages();

    expect(pages).toHaveLength(AUTHORITY_SURFACE_SLUGS.length);
    for (const page of pages) {
      expect(page.science).toBe(getSurfaceScienceProfile(page.slug as AuthoritySurfaceSlug));
    }
  });

  it("upgrades the priority surface science foundations", () => {
    expect(getSurfacePageBySlug("glass")?.science.material.family).toBe("glass");
    expect(getSurfacePageBySlug("glass")?.science.porosity.level).toBe("non-porous");
    expect(getSurfacePageBySlug("mirrors")?.science.moistureTolerance.risks).toContain("Black edge creep");
    expect(getSurfacePageBySlug("shower-glass")?.science.coatingSealer.state).toBe("possible");
    expect(getSurfacePageBySlug("granite-countertops")?.science.material.family).toBe("stone");
    expect(getSurfacePageBySlug("quartz-countertops")?.science.material.family).toBe("composite");
    expect(getSurfacePageBySlug("marble")?.science.chemicalSensitivity.sensitiveTo).toContain("Acids");
    expect(getSurfacePageBySlug("natural-stone")?.science.restorationBoundary.escalationSignals).toContain(
      "Unknown stone identity",
    );
  });
});
