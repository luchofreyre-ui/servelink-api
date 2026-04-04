import type { AuthorityBreadcrumbItem, AuthoritySeeAlsoGroup } from "@/authority/types/authorityNavigationTypes";
import { preferEncyclopediaCanonicalHref } from "@/lib/encyclopedia/encyclopediaCanonicalHref";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getGuidePageBySlug } from "@/authority/data/authorityGuidePageData";
import {
  getMethodSlugsForProblem,
  getMethodSlugsForSurface,
  getProblemSlugsForMethod,
  getProblemSlugsForSurface,
  getSurfaceSlugsForMethod,
  getSurfaceSlugsForProblem,
} from "@/authority/data/authorityGraphSelectors";

function limit<T>(items: T[], max = 6): T[] {
  return items.slice(0, max);
}

/** Maps a problem hub to the closest “best cleaners for …” entry guide, when unambiguous. */
export function entryClusterGuideForProblem(problemSlug: string): string | null {
  const appliances = new Set(["appliance-grime", "burnt-residue", "appliance-buildup"]);
  if (appliances.has(problemSlug)) {
    return "best-cleaners-for-appliances";
  }
  const bath = new Set([
    "soap-scum",
    "hard-water-deposits",
    "light-mildew",
    "soap-film",
    "biofilm-buildup",
    "mold-growth",
    "limescale-buildup",
    "water-spotting",
    "musty-odor",
    "bathroom-buildup",
    "mineral-film",
    "mirror-haze",
    "glass-cloudiness",
  ]);
  if (bath.has(problemSlug)) return "best-cleaners-for-bathrooms";
  const kitchen = new Set([
    "grease-buildup",
    "cooked-on-grease",
    "fingerprints-and-smudges",
    "stuck-on-residue",
    "greasy-grime",
    "kitchen-grease-film",
    "cabinet-grime",
    "countertop-residue",
    "exhaust-hood-film",
    "sink-ring-stains",
  ]);
  if (kitchen.has(problemSlug)) return "best-cleaners-for-kitchens";
  const floor = new Set([
    "floor-residue-buildup",
    "scuff-marks",
    "floor-buildup",
    "film-buildup",
  ]);
  if (floor.has(problemSlug)) return "best-cleaners-for-floors";
  return null;
}

export function buildMethodBreadcrumbs(methodSlug: string): AuthorityBreadcrumbItem[] {
  const method = getMethodPageBySlug(methodSlug);
  if (!method) return [];
  return [
    { label: "Cleaning encyclopedia", href: "/encyclopedia" },
    { label: "Methods", href: "/methods" },
    { label: method.title, href: preferEncyclopediaCanonicalHref(`/methods/${method.slug}`) },
  ];
}

export function buildSurfaceBreadcrumbs(surfaceSlug: string): AuthorityBreadcrumbItem[] {
  const surface = getSurfacePageBySlug(surfaceSlug);
  if (!surface) return [];
  return [
    { label: "Cleaning encyclopedia", href: "/encyclopedia" },
    { label: "Surfaces", href: "/surfaces" },
    { label: surface.title, href: `/surfaces/${surface.slug}` },
  ];
}

export function buildProblemBreadcrumbs(problemSlug: string): AuthorityBreadcrumbItem[] {
  const problem = getProblemPageBySlug(problemSlug);
  if (!problem) return [];
  return [
    { label: "Cleaning encyclopedia", href: "/encyclopedia" },
    { label: "Problems", href: "/problems" },
    { label: problem.title, href: `/problems/${problem.slug}` },
  ];
}

export function buildGuideBreadcrumbs(guideSlug: string): AuthorityBreadcrumbItem[] {
  const guide = getGuidePageBySlug(guideSlug);
  if (!guide) return [];
  return [
    { label: "Cleaning encyclopedia", href: "/encyclopedia" },
    { label: "Guides", href: "/guides" },
    { label: guide.title, href: `/guides/${guide.slug}` },
  ];
}

export function buildMethodComboBreadcrumbs(
  methodSlug: string,
  comboSlug: string,
): AuthorityBreadcrumbItem[] {
  const method = getMethodPageBySlug(methodSlug);
  const surface = getSurfacePageBySlug(comboSlug);
  const problem = getProblemPageBySlug(comboSlug);

  if (!method) return [];

  const comboTitle = surface?.title ?? problem?.title ?? comboSlug;

  return [
    { label: "Cleaning encyclopedia", href: "/encyclopedia" },
    { label: "Methods", href: "/methods" },
    { label: method.title, href: preferEncyclopediaCanonicalHref(`/methods/${method.slug}`) },
    { label: comboTitle, href: `/methods/${methodSlug}/${comboSlug}` },
  ];
}

export function buildSurfaceProblemBreadcrumbs(
  surfaceSlug: string,
  problemSlug: string,
): AuthorityBreadcrumbItem[] {
  const surface = getSurfacePageBySlug(surfaceSlug);
  const problem = getProblemPageBySlug(problemSlug);

  if (!surface || !problem) return [];

  return [
    { label: "Cleaning encyclopedia", href: "/encyclopedia" },
    { label: "Surfaces", href: "/surfaces" },
    { label: surface.title, href: `/surfaces/${surface.slug}` },
    { label: problem.title, href: `/surfaces/${surfaceSlug}/${problem.slug}` },
  ];
}

export function buildMethodSeeAlso(methodSlug: string): AuthoritySeeAlsoGroup[] {
  const method = getMethodPageBySlug(methodSlug);
  if (!method) return [];

  const surfaceLinks = limit(
    getSurfaceSlugsForMethod(methodSlug)
      .map((slug) => getSurfacePageBySlug(slug))
      .filter(Boolean)
      .map((page) => ({
        title: page!.title,
        href: `/methods/${methodSlug}/${page!.slug}`,
        description: `How ${method.title.toLowerCase()} applies to ${page!.title.toLowerCase()}.`,
      })),
  );

  const problemLinks = limit(
    getProblemSlugsForMethod(methodSlug)
      .map((slug) => getProblemPageBySlug(slug))
      .filter(Boolean)
      .map((page) => ({
        title: page!.title,
        href: `/methods/${methodSlug}/${page!.slug}`,
        description: `When ${method.title.toLowerCase()} is used for ${page!.title.toLowerCase()}.`,
      })),
  );

  return [
    ...(surfaceLinks.length ? [{ title: "Method + surface playbooks", links: surfaceLinks }] : []),
    ...(problemLinks.length ? [{ title: "Method + problem playbooks", links: problemLinks }] : []),
  ];
}

export function buildSurfaceSeeAlso(surfaceSlug: string): AuthoritySeeAlsoGroup[] {
  const surface = getSurfacePageBySlug(surfaceSlug);
  if (!surface) return [];

  const methodLinks = limit(
    getMethodSlugsForSurface(surfaceSlug)
      .map((slug) => getMethodPageBySlug(slug))
      .filter(Boolean)
      .map((page) => ({
        title: page!.title,
        href: `/methods/${page!.slug}/${surfaceSlug}`,
        description: `${page!.title} guidance for ${surface.title.toLowerCase()}.`,
      })),
  );

  const problemLinks = limit(
    getProblemSlugsForSurface(surfaceSlug)
      .map((slug) => getProblemPageBySlug(slug))
      .filter(Boolean)
      .map((page) => ({
        title: page!.title,
        href: `/surfaces/${surfaceSlug}/${page!.slug}`,
        description: `How to handle ${page!.title.toLowerCase()} on ${surface.title.toLowerCase()}.`,
      })),
  );

  return [
    ...(methodLinks.length ? [{ title: "Method guides for this surface", links: methodLinks }] : []),
    ...(problemLinks.length ? [{ title: "Common problems on this surface", links: problemLinks }] : []),
  ];
}

export function buildProblemSeeAlso(problemSlug: string): AuthoritySeeAlsoGroup[] {
  const problem = getProblemPageBySlug(problemSlug);
  if (!problem) return [];

  const methodLinks = limit(
    getMethodSlugsForProblem(problemSlug)
      .map((slug) => getMethodPageBySlug(slug))
      .filter(Boolean)
      .map((page) => ({
        title: page!.title,
        href: `/methods/${page!.slug}/${problemSlug}`,
        description: `${page!.title} guidance for ${problem.title.toLowerCase()}.`,
      })),
  );

  const surfaceLinks = limit(
    getSurfaceSlugsForProblem(problemSlug)
      .map((slug) => getSurfacePageBySlug(slug))
      .filter(Boolean)
      .map((page) => ({
        title: page!.title,
        href: `/surfaces/${page!.slug}/${problemSlug}`,
        description: `${problem.title} guidance on ${page!.title.toLowerCase()}.`,
      })),
  );

  const entrySlug = entryClusterGuideForProblem(problemSlug);
  const entryGuide = entrySlug ? getGuidePageBySlug(entrySlug) : undefined;
  const guideAndCompareLinks = [
    ...(entryGuide && entrySlug
      ? [
          {
            title: entryGuide.title,
            href: `/guides/${entrySlug}`,
            description: entryGuide.summary,
          },
        ]
      : []),
    {
      title: "Why cleaning fails",
      href: "/guides/why-cleaning-fails",
      description: "Understand mismatch patterns before escalating chemistry.",
    },
    {
      title: "Chemical usage & safety",
      href: "/guides/chemical-usage-and-safety",
      description: "Label-first rules, ventilation, and mixing cautions.",
    },
    {
      title: "Compare cleaning products",
      href: "/compare/products",
      description: "SKU comparisons on overlapping scenarios.",
    },
    {
      title: "Compare methods",
      href: "/compare/methods",
      description: "When entire method families diverge in risk and fit.",
    },
    {
      title: "Compare problems",
      href: "/compare/problems",
      description: "Disambiguate look-alike contamination types.",
    },
  ];

  return [
    ...(methodLinks.length ? [{ title: "Methods used for this problem", links: methodLinks }] : []),
    ...(surfaceLinks.length ? [{ title: "Surfaces where this problem appears", links: surfaceLinks }] : []),
    { title: "Guides & comparison hubs", links: guideAndCompareLinks },
  ];
}

export function buildGuideSeeAlso(guideSlug: string): AuthoritySeeAlsoGroup[] {
  const guide = getGuidePageBySlug(guideSlug);
  if (!guide) return [];

  const comparisonLinks = limit(
    (guide.linkGroups ?? [])
      .filter((g) => /comparison/i.test(g.title))
      .flatMap((g) => g.links)
      .filter((l) => l.href.includes("/compare/"))
      .map((l) => ({
        title: l.title,
        href: l.href,
        description: l.summary,
      })),
    5,
  );

  const relatedMethods = limit(
    (guide.relatedMethods ?? []).map((m) => ({
      title: m.title,
      href: m.href,
      description: m.summary,
    })),
  );

  const relatedSurfaces = limit(
    (guide.relatedSurfaces ?? []).map((s) => ({
      title: s.title,
      href: s.href,
      description: s.summary,
    })),
  );

  const relatedProblems = limit(
    (guide.relatedProblems ?? []).map((p) => ({
      title: p.title,
      href: p.href,
      description: p.summary,
    })),
  );

  return [
    ...(relatedMethods.length ? [{ title: "Related methods", links: relatedMethods }] : []),
    ...(relatedSurfaces.length ? [{ title: "Related surfaces", links: relatedSurfaces }] : []),
    ...(relatedProblems.length ? [{ title: "Related problems", links: relatedProblems }] : []),
    ...(comparisonLinks.length ? [{ title: "Related comparisons", links: comparisonLinks }] : []),
  ];
}
