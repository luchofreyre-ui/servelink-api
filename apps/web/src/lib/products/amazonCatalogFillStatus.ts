import type { AmazonCatalogImportRecord } from "./amazonCatalogTypes";

export type AmazonCatalogFillStatus =
  | "ready"
  | "purchase_only"
  | "image_only"
  | "partial"
  | "empty";

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function getAmazonCatalogFillStatus(
  record: AmazonCatalogImportRecord,
): AmazonCatalogFillStatus {
  const hasPurchaseLink =
    hasValue(record.amazonUrl) || hasValue(record.amazonAffiliateUrl);
  const hasImage =
    hasValue(record.primaryImageUrl) ||
    Boolean(record.imageUrls && record.imageUrls.length > 0);
  const hasAsin = hasValue(record.asin);

  if (hasPurchaseLink && hasImage && hasAsin) return "ready";
  if (hasPurchaseLink && !hasImage) return "purchase_only";
  if (!hasPurchaseLink && hasImage) return "image_only";
  if (hasPurchaseLink || hasImage || hasAsin) return "partial";
  return "empty";
}
