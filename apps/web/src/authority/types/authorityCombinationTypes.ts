export type AuthorityCombinationPageData = {
  type: "method_surface" | "method_problem" | "surface_problem";
  slug: string;
  title: string;
  description: string;
  overview: string;
  whyItWorks: string;
  risks: string;
  process: string[];
  relatedMethods: string[];
  relatedSurfaces: string[];
  relatedProblems: string[];
  methodSlug?: string;
  surfaceSlug?: string;
  /** Target problem for method_problem or surface_problem combos */
  problemSlug?: string;
};
