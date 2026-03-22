export type TaxonomyEntityKind = "problem" | "surface" | "method" | "tool";

export type TaxonomyEntityLink = {
  slug: string;
  name: string;
  href: string;
  summary?: string;
};

export type TaxonomyCategory = {
  slug: string;
  kind: TaxonomyEntityKind;
  name: string;
  shortDescription: string;
  longDescription: string;
  entitySlugs: string[];
  relatedCategorySlugs: string[];
};

export type TaxonomyCategoryIndexItem = {
  slug: string;
  name: string;
  shortDescription: string;
  href: string;
  entityCount: number;
};

export type TaxonomyCategoryPageData = {
  category: TaxonomyCategory;
  entities: TaxonomyEntityLink[];
  relatedCategories: TaxonomyCategoryIndexItem[];
};

export type TaxonomyKindConfig = {
  kind: TaxonomyEntityKind;
  title: string;
  intro: string;
  basePath: string;
  categoryBasePath: string;
};
