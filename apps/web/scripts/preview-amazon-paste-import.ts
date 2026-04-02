import { AMAZON_PASTE_INPUT } from "../src/lib/products/amazonPasteInput";
import { formatAmazonImportRecordsGrouped, formatAmazonMergeHints } from "../src/lib/products/amazonPasteFormatter";
import { normalizeAmazonPasteRows } from "../src/lib/products/amazonPasteNormalizer";
import { AMAZON_PASTE_RAW_INPUT } from "../src/lib/products/amazonPasteRawInput";
import { parseAmazonPasteTsv } from "../src/lib/products/amazonPasteTsv";

function resolveInputRows() {
  if (AMAZON_PASTE_INPUT.length > 0) return AMAZON_PASTE_INPUT;
  if (AMAZON_PASTE_RAW_INPUT.trim()) return parseAmazonPasteTsv(AMAZON_PASTE_RAW_INPUT);
  return [];
}

function main(): void {
  const inputRows = resolveInputRows();
  const result = normalizeAmazonPasteRows(inputRows);

  console.log("\n=== AMAZON PASTE IMPORT PREVIEW ===\n");
  console.log(`Input rows: ${inputRows.length}`);
  console.log(`Matched: ${result.matched.length}`);
  console.log(`Unmatched: ${result.unmatched.length}`);
  console.log(`Duplicate issues: ${result.duplicates.length}`);
  console.log(`Conflict issues: ${result.conflicts.length}`);
  console.log(`Merge hints: ${result.mergeHints.length}`);

  if (result.unmatched.length > 0) {
    console.log("\n=== UNMATCHED ROWS ===\n");
    for (const row of result.unmatched) {
      const suggestions = row.suggestedSlugs.length
        ? ` | suggestions: ${row.suggestedSlugs.join(", ")}`
        : "";
      console.log(`- ${row.inputName}${suggestions}`);
    }
  }

  if (result.duplicates.length > 0) {
    console.log("\n=== DUPLICATE ISSUES ===\n");
    for (const issue of result.duplicates) {
      console.log(`- [${issue.type}] ${issue.key}`);
      for (const row of issue.rows) {
        console.log(
          `  • ${row.inputName} -> ${row.resolvedSlug ?? "UNMATCHED"}${row.asin ? ` | ASIN ${row.asin}` : ""}`,
        );
      }
    }
  }

  if (result.conflicts.length > 0) {
    console.log("\n=== CONFLICT ISSUES ===\n");
    for (const issue of result.conflicts) {
      console.log(
        `- [${issue.type}] ${issue.key} | incoming="${issue.incoming.inputName}" | existingSlug="${issue.existingSlug}"`,
      );
    }
  }

  if (result.mergeHints.length > 0) {
    console.log("\n=== MERGE HINTS ===\n");
    console.log(formatAmazonMergeHints(result.mergeHints));
  }

  if (result.matched.length > 0) {
    console.log("\n=== READY TO PASTE INTO amazonCatalogImport.ts ===\n");
    console.log(formatAmazonImportRecordsGrouped(result.matched));
  } else {
    console.log("\nNo matched rows to format.\n");
  }
}

main();
