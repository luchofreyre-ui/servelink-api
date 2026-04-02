import type {
  AmazonCatalogImportRecord,
  AmazonCatalogWeakRowIssue,
  AmazonCatalogWeakRowIssueType,
} from "./amazonCatalogTypes";

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function getAmazonCatalogWeakRowIssues(
  records: AmazonCatalogImportRecord[],
): AmazonCatalogWeakRowIssue[] {
  const weakRows: AmazonCatalogWeakRowIssue[] = [];

  for (const record of records) {
    const issues: AmazonCatalogWeakRowIssueType[] = [];

    if (!hasValue(record.asin)) issues.push("missing_asin");
    if (!hasValue(record.amazonUrl)) issues.push("missing_amazon_url");
    if (!hasValue(record.primaryImageUrl)) issues.push("missing_primary_image");
    if (!hasValue(record.brand)) issues.push("missing_brand");
    if (!record.imageUrls || record.imageUrls.length === 0) issues.push("empty_gallery");

    if (record.isPurchaseAvailable && !hasValue(record.amazonUrl) && !hasValue(record.amazonAffiliateUrl)) {
      issues.push("purchase_enabled_without_url");
    }

    if (!issues.length) continue;

    const row: AmazonCatalogWeakRowIssue = { slug: record.slug, issues };
    if (hasValue(record.brand)) row.brand = record.brand;
    weakRows.push(row);
  }

  return weakRows;
}
