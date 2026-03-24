import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import type { AuthorityGraphEdge } from "@/authority/types/authorityGraphTypes";

export function validateAuthorityGraphOrThrow(edges: AuthorityGraphEdge[]): void {
  for (const edge of edges) {
    if (edge.type === "method_surface") {
      if (!getMethodPageBySlug(edge.methodSlug)) {
        throw new Error(`Unknown method slug in graph: ${edge.methodSlug}`);
      }
      if (!getSurfacePageBySlug(edge.surfaceSlug)) {
        throw new Error(`Unknown surface slug in graph: ${edge.surfaceSlug}`);
      }
    }
    if (edge.type === "method_problem") {
      if (!getMethodPageBySlug(edge.methodSlug)) {
        throw new Error(`Unknown method slug in graph: ${edge.methodSlug}`);
      }
      if (!getProblemPageBySlug(edge.problemSlug)) {
        throw new Error(`Unknown problem slug in graph: ${edge.problemSlug}`);
      }
    }
    if (edge.type === "surface_problem") {
      if (!getSurfacePageBySlug(edge.surfaceSlug)) {
        throw new Error(`Unknown surface slug in graph: ${edge.surfaceSlug}`);
      }
      if (!getProblemPageBySlug(edge.problemSlug)) {
        throw new Error(`Unknown problem slug in graph: ${edge.problemSlug}`);
      }
    }
  }
}
