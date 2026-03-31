// graphTypes.ts

export type PageNode = {
  slug: string;
  problem: string;
  surface: string;
  intent: string;
};

export type PageEdge = {
  from: string;
  to: string;
  type: "same-problem" | "same-surface" | "related-problem";
};

export type AuthorityGraph = {
  nodes: PageNode[];
  edges: PageEdge[];
};
