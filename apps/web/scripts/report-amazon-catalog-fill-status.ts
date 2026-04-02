import { getAllAmazonCatalogImports } from "../src/lib/products/amazonCatalogRegistry";
import { getAmazonCatalogFillStatus } from "../src/lib/products/amazonCatalogFillStatus";

function main(): void {
  const records = getAllAmazonCatalogImports();
  const grouped = new Map<string, typeof records>();

  for (const record of records) {
    const status = getAmazonCatalogFillStatus(record);
    const existing = grouped.get(status) ?? [];
    existing.push(record);
    grouped.set(status, existing);
  }

  console.log("\n=== AMAZON CATALOG FILL STATUS ===\n");
  console.log(`Total rows: ${records.length}`);

  for (const status of ["ready", "purchase_only", "image_only", "partial", "empty"] as const) {
    const rows = grouped.get(status) ?? [];
    console.log(`- ${status}: ${rows.length}`);
  }

  for (const status of ["ready", "purchase_only", "image_only", "partial", "empty"] as const) {
    const rows = (grouped.get(status) ?? []).sort((a, b) =>
      a.slug.localeCompare(b.slug),
    );

    if (!rows.length) continue;

    console.log(`\n=== ${status.toUpperCase()} ===\n`);
    for (const row of rows) {
      console.log(`- ${row.slug}${row.brand ? ` (${row.brand})` : ""}`);
    }
  }
}

main();
