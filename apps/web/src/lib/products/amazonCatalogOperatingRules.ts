export const AMAZON_CATALOG_OPERATING_RULES = [
  "Always run preview:amazon-paste-import before editing amazonCatalogImport.ts",
  "Prefer merging into existing rows over creating duplicate slugs",
  "Do not enable purchase without amazonUrl or amazonAffiliateUrl",
  "Provide primaryImageUrl whenever possible",
  "Keep imageUrls deduplicated and useful",
  "Keep amazonCatalogImport.ts sorted by brand, then slug",
] as const;
