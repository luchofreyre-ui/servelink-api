import type { AuthorityCombinationPageData } from "@/authority/types/authorityCombinationTypes";
import type { AuthorityRelationshipDisposition } from "@/authority/types/authorityGraphTypes";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  getMethodProblemEdge,
  getMethodProblemEdges,
  getMethodSlugsForProblem,
  getMethodSlugsForSurface,
  getMethodSurfaceEdge,
  getMethodSurfaceEdges,
  getProblemSlugsForMethod,
  getProblemSlugsForSurface,
  getSurfaceProblemEdge,
  getSurfaceProblemEdges,
  getSurfaceSlugsForMethod,
  getSurfaceSlugsForProblem,
} from "@/authority/data/authorityGraphSelectors";

const MAX_RELATED = 6;

function capSortUnique(slugs: string[]): string[] {
  return [...new Set(slugs)].sort((a, b) => a.localeCompare(b)).slice(0, MAX_RELATED);
}

function dispositionRiskCopy(disposition: AuthorityRelationshipDisposition, subject: string): string {
  if (disposition === "avoid") {
    return `${subject} is marked avoid in the authority graph—use a preferred pairing when possible.`;
  }
  if (disposition === "caution") {
    return `${subject} requires caution: spot-test, respect dwell, and stop if the finish shifts.`;
  }
  return `${subject} is a ${disposition} graph pairing—follow label limits and inspect between passes.`;
}

export function buildMethodSurfacePage(
  methodSlug: string,
  surfaceSlug: string,
): AuthorityCombinationPageData | null {
  const method = getMethodPageBySlug(methodSlug);
  const surface = getSurfacePageBySlug(surfaceSlug);
  const edge = getMethodSurfaceEdge(methodSlug, surfaceSlug);
  if (!method || !surface || !edge) return null;

  return {
    type: "method_surface",
    slug: `${methodSlug}/${surfaceSlug}`,
    title: `${method.title} for ${surface.title}`,
    description: `Authority graph: ${edge.strength} / ${edge.disposition} method + surface playbook.`,
    overview: `${edge.strength} relationship between ${method.title.toLowerCase()} and ${surface.title.toLowerCase()}.`,
    whyItWorks: method.whyItWorks,
    risks: dispositionRiskCopy(edge.disposition, `${method.title} on ${surface.title}`),
    process: [
      "Remove loose soil without dry abrasion where the graph flags risk.",
      "Apply the method with label dilution and dwell suited to this surface.",
      "Rinse or wipe with fresh water and inspect sheen before repeating.",
    ],
    relatedMethods: capSortUnique(
      getMethodSlugsForSurface(surfaceSlug).filter((m) => m !== methodSlug),
    ),
    relatedSurfaces: capSortUnique(
      getSurfaceSlugsForMethod(methodSlug).filter((s) => s !== surfaceSlug),
    ),
    relatedProblems: capSortUnique([
      ...getProblemSlugsForMethod(methodSlug),
      ...getProblemSlugsForSurface(surfaceSlug),
    ]),
    methodSlug,
    surfaceSlug,
  };
}

export function buildMethodProblemPage(
  methodSlug: string,
  problemSlug: string,
): AuthorityCombinationPageData | null {
  const method = getMethodPageBySlug(methodSlug);
  const problem = getProblemPageBySlug(problemSlug);
  const edge = getMethodProblemEdge(methodSlug, problemSlug);
  if (!method || !problem || !edge) return null;

  return {
    type: "method_problem",
    slug: `${methodSlug}/${problemSlug}`,
    title: `${method.title} for ${problem.title}`,
    description: `Authority graph: ${edge.strength} / ${edge.disposition} method + problem playbook.`,
    overview: `${edge.strength} fit for ${problem.title.toLowerCase()} using ${method.title.toLowerCase()}.`,
    whyItWorks: problem.whyItHappens,
    risks: dispositionRiskCopy(edge.disposition, `${method.title} and ${problem.title}`),
    process: [
      "Confirm severity and compatible surfaces before wet work.",
      "Apply the method with ventilation and label dwell.",
      "Rinse or wipe clear; stop if appearance shifts.",
    ],
    relatedMethods: capSortUnique(
      getMethodSlugsForProblem(problemSlug).filter((m) => m !== methodSlug),
    ),
    relatedSurfaces: capSortUnique([
      ...getSurfaceSlugsForMethod(methodSlug),
      ...getSurfaceSlugsForProblem(problemSlug),
    ]),
    relatedProblems: capSortUnique(getProblemSlugsForMethod(methodSlug).filter((p) => p !== problemSlug)),
    methodSlug,
    surfaceSlug: undefined,
    problemSlug,
  };
}

export function buildSurfaceProblemPage(
  surfaceSlug: string,
  problemSlug: string,
): AuthorityCombinationPageData | null {
  const surface = getSurfacePageBySlug(surfaceSlug);
  const problem = getProblemPageBySlug(problemSlug);
  const edge = getSurfaceProblemEdge(surfaceSlug, problemSlug);
  if (!surface || !problem || !edge) return null;

  return {
    type: "surface_problem",
    slug: `${surfaceSlug}/${problemSlug}`,
    title: `${problem.title} on ${surface.title}`,
    description: `Authority graph: ${edge.strength} / ${edge.disposition} surface + problem playbook.`,
    overview: `${edge.strength} framing for ${problem.title.toLowerCase()} on ${surface.title.toLowerCase()}.`,
    whyItWorks: problem.bestMethods,
    risks: dispositionRiskCopy(edge.disposition, `${problem.title} on ${surface.title}`),
    process: [
      "Inspect finish and prior residues.",
      "Choose chemistry allowed for both the surface and problem guides.",
      "Control moisture, dwell, and rinse; dry where seams are sensitive.",
    ],
    relatedMethods: capSortUnique([
      ...getMethodSlugsForSurface(surfaceSlug),
      ...getMethodSlugsForProblem(problemSlug),
    ]),
    relatedSurfaces: capSortUnique(getSurfaceSlugsForProblem(problemSlug).filter((s) => s !== surfaceSlug)),
    relatedProblems: capSortUnique(getProblemSlugsForSurface(surfaceSlug).filter((p) => p !== problemSlug)),
    methodSlug: undefined,
    surfaceSlug,
    problemSlug,
  };
}

export function resolveMethodComboPage(
  methodSlug: string,
  comboSlug: string,
): AuthorityCombinationPageData | null {
  if (getMethodSurfaceEdge(methodSlug, comboSlug)) {
    return buildMethodSurfacePage(methodSlug, comboSlug);
  }
  if (getMethodProblemEdge(methodSlug, comboSlug)) {
    return buildMethodProblemPage(methodSlug, comboSlug);
  }
  return null;
}

export function getMethodComboStaticParams(): { methodSlug: string; comboSlug: string }[] {
  const keys = new Set<string>();
  const out: { methodSlug: string; comboSlug: string }[] = [];
  const push = (methodSlug: string, comboSlug: string) => {
    const k = `${methodSlug}\0${comboSlug}`;
    if (keys.has(k)) return;
    keys.add(k);
    out.push({ methodSlug, comboSlug });
  };

  for (const e of getMethodSurfaceEdges()) {
    push(e.methodSlug, e.surfaceSlug);
  }
  for (const e of getMethodProblemEdges()) {
    push(e.methodSlug, e.problemSlug);
  }

  out.sort((a, b) => {
    const c = a.methodSlug.localeCompare(b.methodSlug);
    return c !== 0 ? c : a.comboSlug.localeCompare(b.comboSlug);
  });
  return out;
}

export function getSurfaceProblemStaticParams(): { surfaceSlug: string; problemSlug: string }[] {
  const out = getSurfaceProblemEdges().map((e) => ({
    surfaceSlug: e.surfaceSlug,
    problemSlug: e.problemSlug,
  }));
  out.sort((a, b) => {
    const c = a.surfaceSlug.localeCompare(b.surfaceSlug);
    return c !== 0 ? c : a.problemSlug.localeCompare(b.problemSlug);
  });
  return out;
}
