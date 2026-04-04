export type SearchDocumentSource =
  | "authority"
  | "encyclopedia"
  | "injected";

export type SearchDocumentType =
  | "problem"
  | "method"
  | "surface"
  | "guide"
  | "question"
  | "cluster"
  | "comparison"
  | "encyclopedia"
  | "product"
  | "product_comparison";

export interface SiteSearchDocument {
  id: string;
  source: SearchDocumentSource;
  type: SearchDocumentType;
  title: string;
  description: string;
  href: string;
  keywords: string[];
  body: string;
}
