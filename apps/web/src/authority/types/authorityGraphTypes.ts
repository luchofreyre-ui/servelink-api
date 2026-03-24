export type AuthorityRelationshipStrength = "primary" | "secondary" | "supporting";

export type AuthorityRelationshipDisposition = "preferred" | "compatible" | "caution" | "avoid";

export type AuthorityMethodSurfaceEdge = {
  type: "method_surface";
  methodSlug: string;
  surfaceSlug: string;
  strength: AuthorityRelationshipStrength;
  disposition: AuthorityRelationshipDisposition;
  notes?: string[];
};

export type AuthorityMethodProblemEdge = {
  type: "method_problem";
  methodSlug: string;
  problemSlug: string;
  strength: AuthorityRelationshipStrength;
  disposition: AuthorityRelationshipDisposition;
  notes?: string[];
};

export type AuthoritySurfaceProblemEdge = {
  type: "surface_problem";
  surfaceSlug: string;
  problemSlug: string;
  strength: AuthorityRelationshipStrength;
  disposition: AuthorityRelationshipDisposition;
  notes?: string[];
};

export type AuthorityGraphEdge =
  | AuthorityMethodSurfaceEdge
  | AuthorityMethodProblemEdge
  | AuthoritySurfaceProblemEdge;
