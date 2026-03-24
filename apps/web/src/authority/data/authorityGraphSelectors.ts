import { AUTHORITY_GRAPH_EDGES } from "@/authority/data/authorityGraphRegistry";
import type {
  AuthorityGraphEdge,
  AuthorityMethodProblemEdge,
  AuthorityMethodSurfaceEdge,
  AuthoritySurfaceProblemEdge,
} from "@/authority/types/authorityGraphTypes";

function sortUnique(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function getAllAuthorityGraphEdges(): AuthorityGraphEdge[] {
  return AUTHORITY_GRAPH_EDGES;
}

export function getMethodSurfaceEdges(): AuthorityMethodSurfaceEdge[] {
  return AUTHORITY_GRAPH_EDGES.filter(
    (edge): edge is AuthorityMethodSurfaceEdge => edge.type === "method_surface",
  );
}

export function getMethodProblemEdges(): AuthorityMethodProblemEdge[] {
  return AUTHORITY_GRAPH_EDGES.filter(
    (edge): edge is AuthorityMethodProblemEdge => edge.type === "method_problem",
  );
}

export function getSurfaceProblemEdges(): AuthoritySurfaceProblemEdge[] {
  return AUTHORITY_GRAPH_EDGES.filter(
    (edge): edge is AuthoritySurfaceProblemEdge => edge.type === "surface_problem",
  );
}

export function getSurfaceSlugsForMethod(methodSlug: string): string[] {
  return sortUnique(
    getMethodSurfaceEdges()
      .filter((edge) => edge.methodSlug === methodSlug)
      .map((edge) => edge.surfaceSlug),
  );
}

export function getProblemSlugsForMethod(methodSlug: string): string[] {
  return sortUnique(
    getMethodProblemEdges()
      .filter((edge) => edge.methodSlug === methodSlug)
      .map((edge) => edge.problemSlug),
  );
}

export function getMethodSlugsForSurface(surfaceSlug: string): string[] {
  return sortUnique(
    getMethodSurfaceEdges()
      .filter((edge) => edge.surfaceSlug === surfaceSlug)
      .map((edge) => edge.methodSlug),
  );
}

export function getProblemSlugsForSurface(surfaceSlug: string): string[] {
  return sortUnique(
    getSurfaceProblemEdges()
      .filter((edge) => edge.surfaceSlug === surfaceSlug)
      .map((edge) => edge.problemSlug),
  );
}

export function getMethodSlugsForProblem(problemSlug: string): string[] {
  return sortUnique(
    getMethodProblemEdges()
      .filter((edge) => edge.problemSlug === problemSlug)
      .map((edge) => edge.methodSlug),
  );
}

export function getSurfaceSlugsForProblem(problemSlug: string): string[] {
  return sortUnique(
    getSurfaceProblemEdges()
      .filter((edge) => edge.problemSlug === problemSlug)
      .map((edge) => edge.surfaceSlug),
  );
}

export function getMethodSurfaceEdge(
  methodSlug: string,
  surfaceSlug: string,
): AuthorityMethodSurfaceEdge | null {
  return (
    getMethodSurfaceEdges().find(
      (edge) => edge.methodSlug === methodSlug && edge.surfaceSlug === surfaceSlug,
    ) ?? null
  );
}

export function getMethodProblemEdge(
  methodSlug: string,
  problemSlug: string,
): AuthorityMethodProblemEdge | null {
  return (
    getMethodProblemEdges().find(
      (edge) => edge.methodSlug === methodSlug && edge.problemSlug === problemSlug,
    ) ?? null
  );
}

export function getSurfaceProblemEdge(
  surfaceSlug: string,
  problemSlug: string,
): AuthoritySurfaceProblemEdge | null {
  return (
    getSurfaceProblemEdges().find(
      (edge) => edge.surfaceSlug === surfaceSlug && edge.problemSlug === problemSlug,
    ) ?? null
  );
}

export function methodSurfaceRelationshipExists(methodSlug: string, surfaceSlug: string): boolean {
  return getMethodSurfaceEdge(methodSlug, surfaceSlug) !== null;
}

export function methodProblemRelationshipExists(methodSlug: string, problemSlug: string): boolean {
  return getMethodProblemEdge(methodSlug, problemSlug) !== null;
}

export function surfaceProblemRelationshipExists(surfaceSlug: string, problemSlug: string): boolean {
  return getSurfaceProblemEdge(surfaceSlug, problemSlug) !== null;
}
