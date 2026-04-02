import { getAllAmazonCatalogImports } from "../src/lib/products/amazonCatalogRegistry";
import { getAmazonCatalogWeakRowIssues } from "../src/lib/products/getAmazonCatalogWeakRowIssues";

function main(): void {
  const records = getAllAmazonCatalogImports();
  const weakRows = getAmazonCatalogWeakRowIssues(records);

  console.log("\n=== AMAZON CATALOG HEALTH REPORT ===\n");
  console.log(`Total rows: ${records.length}`);
  console.log(`Weak rows: ${weakRows.length}`);

  if (!weakRows.length) {
    console.log("\nNo weak rows found.\n");
    return;
  }

  const issueCounts = new Map<string, number>();

  for (const row of weakRows) {
    for (const issue of row.issues) {
      issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
    }
  }

  console.log("\n=== ISSUE COUNTS ===\n");
  for (const [issue, count] of Array.from(issueCounts.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    console.log(`- ${issue}: ${count}`);
  }

  console.log("\n=== WEAK ROWS ===\n");
  for (const row of weakRows.sort((a, b) => a.slug.localeCompare(b.slug))) {
    console.log(
      `- ${row.slug}${row.brand ? ` (${row.brand})` : ""} | ${row.issues.join(", ")}`,
    );
  }
}

main();
