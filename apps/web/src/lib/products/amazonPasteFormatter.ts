import type { AmazonPasteMergeHint, AmazonPasteNormalizedRecord } from "./amazonPasteTypes";

function formatString(value: string | undefined): string {
  return value ? JSON.stringify(value) : '""';
}

function formatStringArray(values: string[]): string {
  if (!values.length) return "[]";
  return `[
    ${values.map((value) => JSON.stringify(value)).join(",\n    ")}
  ]`;
}

export function formatAmazonImportRecord(
  record: AmazonPasteNormalizedRecord,
): string {
  if (!record.resolvedSlug) {
    throw new Error(
      `Cannot format Amazon import record without resolved slug for "${record.inputName}"`,
    );
  }

  return `{
  slug: ${JSON.stringify(record.resolvedSlug)},
  asin: ${formatString(record.asin)},
  amazonUrl: ${formatString(record.amazonUrl)},
  amazonAffiliateUrl: ${formatString(record.amazonAffiliateUrl)},
  brand: ${formatString(record.brand)},
  primaryImageUrl: ${formatString(record.primaryImageUrl)},
  imageUrls: ${formatStringArray(record.imageUrls)},
  buyLabel: ${formatString(record.buyLabel || "Buy on Amazon")},
  isPurchaseAvailable: ${record.isPurchaseAvailable ? "true" : "false"},
}`;
}

export function formatAmazonImportRecords(
  records: AmazonPasteNormalizedRecord[],
): string {
  return records.map(formatAmazonImportRecord).join(",\n");
}

export function formatAmazonImportRecordsGrouped(
  records: AmazonPasteNormalizedRecord[],
): string {
  const grouped = new Map<string, AmazonPasteNormalizedRecord[]>();

  for (const record of records) {
    const brandKey = record.brand?.trim() || "Unbranded";
    const existing = grouped.get(brandKey) ?? [];
    existing.push(record);
    grouped.set(brandKey, existing);
  }

  const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return sortedGroups
    .map(([brand, brandRecords]) => {
      const sortedRecords = [...brandRecords].sort((a, b) =>
        (a.resolvedSlug ?? "").localeCompare(b.resolvedSlug ?? ""),
      );

      return `// ${brand}\n${formatAmazonImportRecords(sortedRecords)}`;
    })
    .join("\n\n");
}

export function formatAmazonMergeHints(hints: AmazonPasteMergeHint[]): string {
  return hints
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map(
      (hint) =>
        `- ${hint.slug} | ${hint.action} | ${hint.reasons.join("; ")}`,
    )
    .join("\n");
}
