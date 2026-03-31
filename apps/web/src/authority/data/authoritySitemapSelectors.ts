import { getAllMethodPages } from "./authorityMethodPageData";
import { getAllSurfacePages } from "./authoritySurfacePageData";
import { getAllProblemPages } from "./authorityProblemPageData";
import { getAllGuidePages } from "./authorityGuidePageData";
import { getAllComparisonSeeds, normalizeComparisonSlug } from "./authorityComparisonSelectors";
import { getAllClusterSeeds } from "./authorityClusterSelectors";
import { getMethodComboStaticParams, getSurfaceProblemStaticParams } from "./authorityCombinationBuilder";
import {
  getClusterDetailCanonicalPath,
  getClustersCanonicalPath,
  getCompareHubCanonicalPath,
  getComparisonCanonicalPath,
  getEncyclopediaCanonicalPath,
  getGuideDetailCanonicalPath,
  getGuidesIndexCanonicalPath,
  getMethodComboCanonicalPath,
  getMethodDetailCanonicalPath,
  getMethodsIndexCanonicalPath,
  getProblemDetailCanonicalPath,
  getProblemsIndexCanonicalPath,
  getSurfaceDetailCanonicalPath,
  getSurfaceProblemComboCanonicalPath,
  getSurfacesIndexCanonicalPath,
} from "../metadata/authorityCanonicalPaths";
import { resolveCanonicalMetadataHref } from "@/lib/encyclopedia/encyclopediaCanonicalMetadataHref";
import { getAuthorityLastmodDate } from "./authorityLastmod";
import { AuthoritySitemapSection, AuthoritySitemapUrlEntry } from "../types/authoritySitemapTypes";
import { AUTHORITY_SITEMAP_SECTION_ORDER } from "./authoritySitemapRegistry";

const BASE_URL = "https://www.nustandardcleaning.com";

function absolute(path: string): string {
  return `${BASE_URL}${path}`;
}

function entry(path: string): AuthoritySitemapUrlEntry {
  const resolvedPath = resolveCanonicalMetadataHref(path);
  return {
    url: absolute(resolvedPath),
    lastModified: getAuthorityLastmodDate(),
  };
}

function sectionOrderIndex(slug: string): number {
  const order = AUTHORITY_SITEMAP_SECTION_ORDER as readonly string[];
  const idx = order.indexOf(slug);
  return idx === -1 ? order.length : idx;
}

export function getAuthorityStaticIndexEntries(): AuthoritySitemapUrlEntry[] {
  return [
    entry(getEncyclopediaCanonicalPath()),
    entry(getMethodsIndexCanonicalPath()),
    entry(getSurfacesIndexCanonicalPath()),
    entry(getProblemsIndexCanonicalPath()),
    entry(getGuidesIndexCanonicalPath()),
    entry(getCompareHubCanonicalPath("methods")),
    entry(getCompareHubCanonicalPath("surfaces")),
    entry(getCompareHubCanonicalPath("problems")),
    entry(getClustersCanonicalPath()),
  ];
}

export function getAuthorityMethodDetailEntries(): AuthoritySitemapUrlEntry[] {
  return getAllMethodPages().map((page) => entry(getMethodDetailCanonicalPath(page.slug)));
}

export function getAuthoritySurfaceDetailEntries(): AuthoritySitemapUrlEntry[] {
  return getAllSurfacePages().map((page) => entry(getSurfaceDetailCanonicalPath(page.slug)));
}

export function getAuthorityProblemDetailEntries(): AuthoritySitemapUrlEntry[] {
  return getAllProblemPages().map((page) => entry(getProblemDetailCanonicalPath(page.slug)));
}

export function getAuthorityGuideDetailEntries(): AuthoritySitemapUrlEntry[] {
  return getAllGuidePages().map((page) => entry(getGuideDetailCanonicalPath(page.slug)));
}

export function getAuthorityMethodComboEntries(): AuthoritySitemapUrlEntry[] {
  return getMethodComboStaticParams().map(({ methodSlug, comboSlug }) =>
    entry(getMethodComboCanonicalPath(methodSlug, comboSlug))
  );
}

export function getAuthoritySurfaceProblemComboEntries(): AuthoritySitemapUrlEntry[] {
  return getSurfaceProblemStaticParams().map(({ surfaceSlug, problemSlug }) =>
    entry(getSurfaceProblemComboCanonicalPath(surfaceSlug, problemSlug))
  );
}

export function getAuthorityComparisonEntries(): AuthoritySitemapUrlEntry[] {
  return getAllComparisonSeeds().map((seed) => {
    const comparisonSlug = normalizeComparisonSlug(seed.leftSlug, seed.rightSlug);

    if (seed.type === "method_comparison") {
      return entry(getComparisonCanonicalPath("methods", comparisonSlug));
    }

    if (seed.type === "surface_comparison") {
      return entry(getComparisonCanonicalPath("surfaces", comparisonSlug));
    }

    return entry(getComparisonCanonicalPath("problems", comparisonSlug));
  });
}

export function getAuthorityClusterEntries(): AuthoritySitemapUrlEntry[] {
  return getAllClusterSeeds().map((seed) =>
    entry(getClusterDetailCanonicalPath(seed.slug))
  );
}

export function getAuthoritySitemapSections(): AuthoritySitemapSection[] {
  const sections: AuthoritySitemapSection[] = [
    {
      slug: "authority-core",
      urls: getAuthorityStaticIndexEntries(),
    },
    {
      slug: "authority-methods",
      urls: getAuthorityMethodDetailEntries(),
    },
    {
      slug: "authority-surfaces",
      urls: getAuthoritySurfaceDetailEntries(),
    },
    {
      slug: "authority-problems",
      urls: getAuthorityProblemDetailEntries(),
    },
    {
      slug: "authority-guides",
      urls: getAuthorityGuideDetailEntries(),
    },
    {
      slug: "authority-method-combos",
      urls: getAuthorityMethodComboEntries(),
    },
    {
      slug: "authority-surface-problem-combos",
      urls: getAuthoritySurfaceProblemComboEntries(),
    },
    {
      slug: "authority-comparisons",
      urls: getAuthorityComparisonEntries(),
    },
    {
      slug: "authority-clusters",
      urls: getAuthorityClusterEntries(),
    },
  ];

  return sections
    .filter((section) => section.urls.length > 0)
    .sort((a, b) => sectionOrderIndex(a.slug) - sectionOrderIndex(b.slug));
}
