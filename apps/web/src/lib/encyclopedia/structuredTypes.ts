export type StructuredSection =
  | {
      kind: "prose";
      id: string;
      title: string;
      body: string;
    }
  | {
      kind: "meta_grid";
      id: string;
      title: string;
      rows: Array<{ label: string; value: string }>;
    }
  | {
      kind: "link_list";
      id: string;
      title: string;
      slugs: string[];
    }
  | {
      kind: "decision_box";
      id: string;
      title: string;
      yes: string[];
      no: string[];
      partial: string[];
    }
  | {
      kind: "tool_list";
      id: string;
      title: string;
      items: string[];
    }
  | {
      kind: "product_list";
      id: string;
      title: string;
      items: string[];
    }
  | {
      kind: "diagnostic_grid";
      id: string;
      title: string;
      items: Array<{ label: string; body: string }>;
    };

export type StructuredArticle = {
  title: string;
  slug: string;
  sections: StructuredSection[];
  internalLinks?: Array<{ title: string; slug: string }>;
};
