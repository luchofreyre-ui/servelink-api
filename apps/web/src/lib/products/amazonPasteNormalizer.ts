import { AMAZON_PASTE_ALIASES } from "./amazonPasteAliases";
import { getAllAmazonCatalogImports } from "./amazonCatalogRegistry";
import { PRODUCTS_RAW } from "./products.seed";
import type {
  AmazonPasteConflictIssue,
  AmazonPasteDuplicateIssue,
  AmazonPasteMergeHint,
  AmazonPasteNormalizationResult,
  AmazonPasteNormalizedRecord,
  AmazonPasteRow,
} from "./amazonPasteTypes";

function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
  );
}

function normalizeAmazonUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    url.searchParams.delete("tag");
    return url.toString();
  } catch {
    return trimmed;
  }
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(" ").filter(Boolean);
}

function scoreSlugCandidate(inputName: string, productName: string): number {
  const inputTokens = tokenize(inputName);
  const productTokens = tokenize(productName);

  if (!inputTokens.length || !productTokens.length) return 0;

  let score = 0;

  for (const token of inputTokens) {
    if (productTokens.includes(token)) score += 2;
    if (productName.toLowerCase().includes(token)) score += 1;
  }

  if (normalizeText(inputName) === normalizeText(productName)) {
    score += 10;
  }

  return score;
}

function getSuggestedSlugs(row: AmazonPasteRow): string[] {
  const scored = PRODUCTS_RAW.map((product) => ({
    slug: product.slug,
    score: scoreSlugCandidate(row.name, product.name),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))
    .slice(0, 3);

  return scored.map((entry) => entry.slug);
}

function resolveSlug(row: AmazonPasteRow, suggestedSlugs: string[]): string | null {
  if (row.slug?.trim()) return row.slug.trim();

  const targetName = normalizeText(row.name);
  if (!targetName) return null;

  const aliasSlug = AMAZON_PASTE_ALIASES[targetName];
  if (aliasSlug) return aliasSlug;

  const exact = PRODUCTS_RAW.find((product) => {
    const productName = normalizeText(product.name);
    return productName === targetName;
  });

  if (exact) return exact.slug;

  const contains = PRODUCTS_RAW.find((product) => {
    const productName = normalizeText(product.name);
    return (
      productName.includes(targetName) || targetName.includes(productName)
    );
  });

  if (contains) return contains.slug;

  return suggestedSlugs[0] ?? null;
}

function normalizeRow(row: AmazonPasteRow): AmazonPasteNormalizedRecord {
  const asin = row.asin?.trim() || undefined;
  const derivedAmazonUrl =
    row.amazonUrl?.trim() ||
    (asin ? `https://www.amazon.com/dp/${asin}` : undefined);
  const suggestedSlugs = getSuggestedSlugs(row);
  const resolvedSlug = resolveSlug(row, suggestedSlugs);

  return {
    inputName: row.name.trim(),
    resolvedSlug,
    suggestedSlugs,
    asin,
    amazonUrl: normalizeAmazonUrl(derivedAmazonUrl),
    amazonAffiliateUrl: row.amazonAffiliateUrl?.trim() || undefined,
    brand: row.brand?.trim() || undefined,
    primaryImageUrl: row.primaryImageUrl?.trim() || undefined,
    imageUrls: uniqueStrings(row.imageUrls ?? []),
    buyLabel: row.buyLabel?.trim() || undefined,
    isPurchaseAvailable: row.isPurchaseAvailable ?? true,
  };
}

function collectDuplicateIssues(
  rows: AmazonPasteNormalizedRecord[],
): AmazonPasteDuplicateIssue[] {
  const duplicateIssues: AmazonPasteDuplicateIssue[] = [];
  const slugMap = new Map<string, AmazonPasteNormalizedRecord[]>();
  const asinMap = new Map<string, AmazonPasteNormalizedRecord[]>();

  for (const row of rows) {
    if (row.resolvedSlug) {
      const existing = slugMap.get(row.resolvedSlug) ?? [];
      existing.push(row);
      slugMap.set(row.resolvedSlug, existing);
    }

    if (row.asin) {
      const existing = asinMap.get(row.asin) ?? [];
      existing.push(row);
      asinMap.set(row.asin, existing);
    }
  }

  for (const [key, groupedRows] of slugMap.entries()) {
    if (groupedRows.length > 1) {
      duplicateIssues.push({ type: "duplicate_slug", key, rows: groupedRows });
    }
  }

  for (const [key, groupedRows] of asinMap.entries()) {
    if (groupedRows.length > 1) {
      duplicateIssues.push({ type: "duplicate_asin", key, rows: groupedRows });
    }
  }

  return duplicateIssues;
}

function collectConflictIssues(
  rows: AmazonPasteNormalizedRecord[],
): AmazonPasteConflictIssue[] {
  const existingImports = getAllAmazonCatalogImports();
  const conflicts: AmazonPasteConflictIssue[] = [];

  const existingBySlug = new Map(existingImports.map((row) => [row.slug, row]));
  const existingByAsin = new Map(
    existingImports
      .filter((row) => row.asin)
      .map((row) => [row.asin as string, row]),
  );
  const existingByUrlEntries: [string, (typeof existingImports)[number]][] = [];
  for (const row of existingImports) {
    const normalized = normalizeAmazonUrl(row.amazonUrl);
    if (normalized) existingByUrlEntries.push([normalized, row]);
  }
  const existingByUrl = new Map(existingByUrlEntries);

  for (const row of rows) {
    if (row.resolvedSlug) {
      const existingSlugRow = existingBySlug.get(row.resolvedSlug);
      if (existingSlugRow) {
        const incomingAsin = row.asin ?? "";
        const existingAsin = existingSlugRow.asin ?? "";
        const incomingUrl = row.amazonUrl ?? "";
        const existingUrl = normalizeAmazonUrl(existingSlugRow.amazonUrl) ?? "";

        if (
          (incomingAsin && existingAsin && incomingAsin !== existingAsin) ||
          (incomingUrl && existingUrl && incomingUrl !== existingUrl)
        ) {
          conflicts.push({
            type: "existing_slug_conflict",
            key: row.resolvedSlug,
            incoming: row,
            existingSlug: existingSlugRow.slug,
          });
        }
      }
    }

    if (row.asin) {
      const existingAsinRow = existingByAsin.get(row.asin);
      if (
        existingAsinRow &&
        row.resolvedSlug &&
        existingAsinRow.slug !== row.resolvedSlug
      ) {
        conflicts.push({
          type: "existing_asin_conflict",
          key: row.asin,
          incoming: row,
          existingSlug: existingAsinRow.slug,
        });
      }
    }

    if (row.amazonUrl) {
      const existingUrlRow = existingByUrl.get(row.amazonUrl);
      if (
        existingUrlRow &&
        row.resolvedSlug &&
        existingUrlRow.slug !== row.resolvedSlug
      ) {
        conflicts.push({
          type: "existing_url_conflict",
          key: row.amazonUrl,
          incoming: row,
          existingSlug: existingUrlRow.slug,
        });
      }
    }
  }

  return conflicts;
}

function collectMergeHints(
  rows: AmazonPasteNormalizedRecord[],
): AmazonPasteMergeHint[] {
  const existingImports = getAllAmazonCatalogImports();
  const existingBySlug = new Map(existingImports.map((row) => [row.slug, row]));

  return rows
    .filter((row): row is AmazonPasteNormalizedRecord & { resolvedSlug: string } =>
      Boolean(row.resolvedSlug),
    )
    .map((row) => {
      const existing = existingBySlug.get(row.resolvedSlug);
      if (!existing) {
        return {
          slug: row.resolvedSlug,
          action: "add" as const,
          reasons: ["No existing import row for this slug"],
        };
      }

      const reasons: string[] = [];
      let action: "merge" | "replace_review" = "merge";

      if (row.asin && existing.asin && row.asin !== existing.asin) {
        action = "replace_review";
        reasons.push(`ASIN differs: existing=${existing.asin} incoming=${row.asin}`);
      }

      if (
        row.amazonUrl &&
        existing.amazonUrl &&
        normalizeAmazonUrl(row.amazonUrl) !== normalizeAmazonUrl(existing.amazonUrl)
      ) {
        action = "replace_review";
        reasons.push("Amazon URL differs from existing import row");
      }

      if (row.primaryImageUrl && !existing.primaryImageUrl) {
        reasons.push("Incoming row adds primary image");
      }

      if (row.imageUrls.length > (existing.imageUrls?.length ?? 0)) {
        reasons.push("Incoming row has a larger image gallery");
      }

      if (!reasons.length) {
        reasons.push("Existing row present; merge non-conflicting missing fields");
      }

      return {
        slug: row.resolvedSlug,
        action,
        reasons,
      };
    });
}

export function normalizeAmazonPasteRows(
  rows: AmazonPasteRow[],
): AmazonPasteNormalizationResult {
  const normalized = rows.map(normalizeRow);

  return {
    matched: normalized.filter((row) => Boolean(row.resolvedSlug)),
    unmatched: normalized.filter((row) => !row.resolvedSlug),
    duplicates: collectDuplicateIssues(normalized),
    conflicts: collectConflictIssues(normalized),
    mergeHints: collectMergeHints(normalized),
  };
}
