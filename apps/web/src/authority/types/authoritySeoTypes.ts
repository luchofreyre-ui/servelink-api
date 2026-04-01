export type AuthorityPageFamily =
  | "encyclopedia_index"
  | "methods_index"
  | "surfaces_index"
  | "problems_index"
  | "guides_index"
  | "compare_index"
  | "clusters_index"
  | "method_detail"
  | "surface_detail"
  | "problem_detail"
  | "guide_detail"
  | "method_combo"
  | "surface_problem_combo"
  | "method_compare_detail"
  | "surface_compare_detail"
  | "problem_compare_detail"
  | "product_compare_detail"
  | "cluster_detail";

export interface AuthoritySeoPolicy {
  family: AuthorityPageFamily;
  canonicalPath: string;
  shouldIndex: boolean;
}
