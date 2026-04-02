import type { AmazonPasteRow } from "./amazonPasteTypes";

type HeaderKey =
  | "name"
  | "slug"
  | "asin"
  | "amazonUrl"
  | "amazonAffiliateUrl"
  | "brand"
  | "primaryImageUrl"
  | "imageUrls"
  | "buyLabel"
  | "isPurchaseAvailable";

const HEADER_ALIASES: Record<string, HeaderKey> = {
  name: "name",
  title: "name",
  product: "name",
  productname: "name",

  slug: "slug",

  asin: "asin",

  amazonurl: "amazonUrl",
  url: "amazonUrl",
  producturl: "amazonUrl",

  amazonaffiliateurl: "amazonAffiliateUrl",
  affiliateurl: "amazonAffiliateUrl",

  brand: "brand",
  manufacturer: "brand",

  primaryimageurl: "primaryImageUrl",
  image: "primaryImageUrl",
  imageurl: "primaryImageUrl",

  imageurls: "imageUrls",
  images: "imageUrls",
  gallery: "imageUrls",

  buylabel: "buyLabel",
  ctalabel: "buyLabel",

  ispurchaseready: "isPurchaseAvailable",
  ispurchaseavailable: "isPurchaseAvailable",
  purchaseready: "isPurchaseAvailable",
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function parseBoolean(value: string | undefined): boolean | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return undefined;
}

function parseImageUrls(value: string | undefined): string[] | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const parts = trimmed
    .split(/[,\n|]/g)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length ? parts : undefined;
}

export function parseAmazonPasteTsv(tsv: string): AmazonPasteRow[] {
  const trimmed = tsv.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split("\t");
  const headers = rawHeaders.map((header) => HEADER_ALIASES[normalizeHeader(header)]);

  const rows: AmazonPasteRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = line.split("\t");
    const record: Partial<AmazonPasteRow> = {};

    for (let index = 0; index < headers.length; index += 1) {
      const header = headers[index];
      const cell = cells[index]?.trim() ?? "";

      if (!header || !cell) continue;

      switch (header) {
        case "imageUrls":
          record.imageUrls = parseImageUrls(cell);
          break;
        case "isPurchaseAvailable":
          record.isPurchaseAvailable = parseBoolean(cell);
          break;
        default:
          (record as Record<string, unknown>)[header] = cell;
      }
    }

    if (record.name?.trim()) {
      rows.push(record as AmazonPasteRow);
    }
  }

  return rows;
}
