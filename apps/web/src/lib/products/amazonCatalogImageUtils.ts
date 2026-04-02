import type { AmazonCatalogImportRecord } from "./amazonCatalogTypes";

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeAmazonImageUrl(value: string | undefined): string | undefined {
  const trimmed = clean(value);
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    return url.toString();
  } catch {
    return trimmed;
  }
}

function uniqueUrls(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeAmazonImageUrl(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export function normalizeAmazonCatalogImages(
  record: AmazonCatalogImportRecord,
): AmazonCatalogImportRecord {
  const normalizedPrimary = normalizeAmazonImageUrl(record.primaryImageUrl);
  const normalizedGallery = uniqueUrls(record.imageUrls ?? []);

  const mergedGallery = uniqueUrls([
    normalizedPrimary,
    ...normalizedGallery,
  ]);

  const primaryImageUrl = normalizedPrimary ?? mergedGallery[0] ?? undefined;

  return {
    ...record,
    primaryImageUrl,
    imageUrls: mergedGallery,
  };
}

export function getAmazonCatalogImageCount(
  record: AmazonCatalogImportRecord,
): number {
  return normalizeAmazonCatalogImages(record).imageUrls?.length ?? 0;
}
