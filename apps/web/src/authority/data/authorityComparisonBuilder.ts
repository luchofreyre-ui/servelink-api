import type {
  AuthorityComparisonPageData,
  AuthorityComparisonRow,
  AuthorityMethodPageData,
  AuthorityProblemPageData,
  AuthoritySurfacePageData,
} from "../types/authorityPageTypes";
import {
  getComparisonSeedBySlug,
  getComparisonSeedsByType,
  normalizeComparisonSlug,
} from "./authorityComparisonSelectors";
import {
  getMethodSlugsForProblem,
  getMethodSlugsForSurface,
  getProblemSlugsForMethod,
  getProblemSlugsForSurface,
  getSurfaceSlugsForMethod,
  getSurfaceSlugsForProblem,
} from "./authorityGraphSelectors";
import { getMethodPageBySlug } from "./authorityMethodPageData";
import { getProblemPageBySlug } from "./authorityProblemPageData";
import { getSurfacePageBySlug } from "./authoritySurfacePageData";

function uniqueSorted(values: string[], exclude: string[] = [], max = 6): string[] {
  return Array.from(new Set(values))
    .filter((value) => !exclude.includes(value))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, max);
}

function joinOrNone(values?: string[]): string {
  return values?.length ? values.join(", ") : "Not specified";
}

function methodsViaSurfacesForPair(methodA: string, methodB: string): string[] {
  const surfaces = new Set([
    ...getSurfaceSlugsForMethod(methodA),
    ...getSurfaceSlugsForMethod(methodB),
  ]);
  const methods: string[] = [];
  for (const s of surfaces) {
    methods.push(...getMethodSlugsForSurface(s));
  }
  return uniqueSorted(methods, [methodA, methodB]);
}

function buildMethodRows(
  left: AuthorityMethodPageData,
  right: AuthorityMethodPageData,
): AuthorityComparisonRow[] {
  return [
    {
      label: "Primary role",
      leftValue: left.summary,
      rightValue: right.summary,
    },
    {
      label: "Connected surfaces",
      leftValue: joinOrNone(getSurfaceSlugsForMethod(left.slug)),
      rightValue: joinOrNone(getSurfaceSlugsForMethod(right.slug)),
    },
    {
      label: "Connected problems",
      leftValue: joinOrNone(getProblemSlugsForMethod(left.slug)),
      rightValue: joinOrNone(getProblemSlugsForMethod(right.slug)),
    },
  ];
}

function buildSurfaceRows(
  left: AuthoritySurfacePageData,
  right: AuthoritySurfacePageData,
): AuthorityComparisonRow[] {
  return [
    {
      label: "Surface description",
      leftValue: left.summary,
      rightValue: right.summary,
    },
    {
      label: "Connected methods",
      leftValue: joinOrNone(getMethodSlugsForSurface(left.slug)),
      rightValue: joinOrNone(getMethodSlugsForSurface(right.slug)),
    },
    {
      label: "Connected problems",
      leftValue: joinOrNone(getProblemSlugsForSurface(left.slug)),
      rightValue: joinOrNone(getProblemSlugsForSurface(right.slug)),
    },
  ];
}

function buildProblemRows(
  left: AuthorityProblemPageData,
  right: AuthorityProblemPageData,
): AuthorityComparisonRow[] {
  return [
    {
      label: "Problem category",
      leftValue: left.category,
      rightValue: right.category,
    },
    {
      label: "Typical symptoms",
      leftValue: joinOrNone(left.symptoms),
      rightValue: joinOrNone(right.symptoms),
    },
    {
      label: "Typical causes",
      leftValue: joinOrNone(left.causes),
      rightValue: joinOrNone(right.causes),
    },
    {
      label: "Connected methods",
      leftValue: joinOrNone(getMethodSlugsForProblem(left.slug)),
      rightValue: joinOrNone(getMethodSlugsForProblem(right.slug)),
    },
    {
      label: "Connected surfaces",
      leftValue: joinOrNone(getSurfaceSlugsForProblem(left.slug)),
      rightValue: joinOrNone(getSurfaceSlugsForProblem(right.slug)),
    },
  ];
}

export function buildMethodComparisonPage(comparisonSlug: string): AuthorityComparisonPageData | null {
  const seed = getComparisonSeedBySlug("method_comparison", comparisonSlug);
  if (!seed) return null;

  const left = getMethodPageBySlug(seed.leftSlug);
  const right = getMethodPageBySlug(seed.rightSlug);
  if (!left || !right) return null;

  return {
    type: "method_comparison",
    slug: normalizeComparisonSlug(left.slug, right.slug),
    leftSlug: left.slug,
    rightSlug: right.slug,
    title: `${left.title} vs ${right.title}`,
    description: `A structured comparison of ${left.title.toLowerCase()} and ${right.title.toLowerCase()}, including connected surfaces, problems, and cleaning role.`,
    intro: `${left.title} and ${right.title} solve different kinds of cleaning problems. Comparing them helps clarify where each method fits, what it connects to, and where misuse can create bad outcomes.`,
    rows: buildMethodRows(left, right),
    relatedMethods: methodsViaSurfacesForPair(left.slug, right.slug),
    relatedSurfaces: uniqueSorted([
      ...getSurfaceSlugsForMethod(left.slug),
      ...getSurfaceSlugsForMethod(right.slug),
    ]),
    relatedProblems: uniqueSorted([
      ...getProblemSlugsForMethod(left.slug),
      ...getProblemSlugsForMethod(right.slug),
    ]),
  };
}

export function buildSurfaceComparisonPage(comparisonSlug: string): AuthorityComparisonPageData | null {
  const seed = getComparisonSeedBySlug("surface_comparison", comparisonSlug);
  if (!seed) return null;

  const left = getSurfacePageBySlug(seed.leftSlug);
  const right = getSurfacePageBySlug(seed.rightSlug);
  if (!left || !right) return null;

  return {
    type: "surface_comparison",
    slug: normalizeComparisonSlug(left.slug, right.slug),
    leftSlug: left.slug,
    rightSlug: right.slug,
    title: `${left.title} vs ${right.title}`,
    description: `A structured comparison of ${left.title.toLowerCase()} and ${right.title.toLowerCase()}, including linked methods, common problems, and surface risk patterns.`,
    intro: `${left.title} and ${right.title} do not respond to cleaning the same way. Comparing them clarifies what risks matter, what methods connect to each one, and why one surface should not be treated like the other.`,
    rows: buildSurfaceRows(left, right),
    relatedMethods: uniqueSorted([
      ...getMethodSlugsForSurface(left.slug),
      ...getMethodSlugsForSurface(right.slug),
    ]),
    relatedSurfaces: uniqueSorted([], [left.slug, right.slug]),
    relatedProblems: uniqueSorted([
      ...getProblemSlugsForSurface(left.slug),
      ...getProblemSlugsForSurface(right.slug),
    ]),
  };
}

export function buildProblemComparisonPage(comparisonSlug: string): AuthorityComparisonPageData | null {
  const seed = getComparisonSeedBySlug("problem_comparison", comparisonSlug);
  if (!seed) return null;

  const left = getProblemPageBySlug(seed.leftSlug);
  const right = getProblemPageBySlug(seed.rightSlug);
  if (!left || !right) return null;

  return {
    type: "problem_comparison",
    slug: normalizeComparisonSlug(left.slug, right.slug),
    leftSlug: left.slug,
    rightSlug: right.slug,
    title: `${left.title} vs ${right.title}`,
    description: `A structured comparison of ${left.title.toLowerCase()} and ${right.title.toLowerCase()}, including category, symptoms, causes, and connected cleaning methods.`,
    intro: `${left.title} and ${right.title} can look similar at first, but they often come from different causes and require different decisions. Comparing them reduces misidentification and helps route users toward the right playbooks.`,
    rows: buildProblemRows(left, right),
    relatedMethods: uniqueSorted([
      ...getMethodSlugsForProblem(left.slug),
      ...getMethodSlugsForProblem(right.slug),
    ]),
    relatedSurfaces: uniqueSorted([
      ...getSurfaceSlugsForProblem(left.slug),
      ...getSurfaceSlugsForProblem(right.slug),
    ]),
    relatedProblems: uniqueSorted([], [left.slug, right.slug]),
  };
}

export function getMethodComparisonStaticParams() {
  return getComparisonSeedsByType("method_comparison").map((seed) => ({
    comparisonSlug: normalizeComparisonSlug(seed.leftSlug, seed.rightSlug),
  }));
}

export function getSurfaceComparisonStaticParams() {
  return getComparisonSeedsByType("surface_comparison").map((seed) => ({
    comparisonSlug: normalizeComparisonSlug(seed.leftSlug, seed.rightSlug),
  }));
}

export function getProblemComparisonStaticParams() {
  return getComparisonSeedsByType("problem_comparison").map((seed) => ({
    comparisonSlug: normalizeComparisonSlug(seed.leftSlug, seed.rightSlug),
  }));
}
