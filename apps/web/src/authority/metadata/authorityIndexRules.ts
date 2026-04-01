import type { AuthorityPageFamily } from "../types/authoritySeoTypes";

export function isAuthorityFamilyIndexable(family: AuthorityPageFamily): boolean {
  switch (family) {
    case "encyclopedia_index":
    case "methods_index":
    case "surfaces_index":
    case "problems_index":
    case "guides_index":
    case "compare_index":
    case "clusters_index":
    case "method_detail":
    case "surface_detail":
    case "problem_detail":
    case "guide_detail":
    case "method_combo":
    case "surface_problem_combo":
    case "method_compare_detail":
    case "surface_compare_detail":
    case "problem_compare_detail":
    case "product_compare_detail":
    case "cluster_detail":
      return true;
    default:
      return true;
  }
}
