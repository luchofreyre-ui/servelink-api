export type AmazonCatalogImportRecord = {
  slug: string;
  asin?: string;
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  brand?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  buyLabel?: string;
  isPurchaseAvailable?: boolean;
};

export type AmazonCatalogWeakRowIssueType =
  | "missing_asin"
  | "missing_amazon_url"
  | "missing_primary_image"
  | "missing_brand"
  | "empty_gallery"
  | "purchase_enabled_without_url";

export type AmazonCatalogWeakRowIssue = {
  slug: string;
  brand?: string;
  issues: AmazonCatalogWeakRowIssueType[];
};
