import { AMAZON_CATALOG_IMPORT } from "./amazonCatalogImport";
import { normalizeAmazonCatalogImages } from "./amazonCatalogImageUtils";
import type { AmazonCatalogImportRecord } from "./amazonCatalogTypes";

const NORMALIZED_AMAZON_CATALOG_IMPORT: AmazonCatalogImportRecord[] =
  AMAZON_CATALOG_IMPORT.map(normalizeAmazonCatalogImages);

const bySlug = new Map<string, AmazonCatalogImportRecord>();

for (const record of NORMALIZED_AMAZON_CATALOG_IMPORT) {
  bySlug.set(record.slug, record);
}

export function getAmazonCatalogImportBySlug(
  slug: string,
): AmazonCatalogImportRecord | null {
  return bySlug.get(slug) ?? null;
}

export function getAllAmazonCatalogImports(): AmazonCatalogImportRecord[] {
  return NORMALIZED_AMAZON_CATALOG_IMPORT;
}
