/**
 * Migration disposition queue from convergence audit (planning/reporting only).
 * Run from apps/web: npm run plan:encyclopedia-migration
 *
 * Options:
 *   --json                 Full JSON (summary + report), or bucket slice with --bucket=
 *   --bucket=redirectLater | keepForNow | review
 */
import {
  buildMigrationDispositionReport,
  summarizeMigrationDispositionReport,
} from "../../src/lib/encyclopedia/migrationDisposition";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const bucketArg = args.find((arg) => arg.startsWith("--bucket="));
const bucket = bucketArg?.split("=")[1];

const report = buildMigrationDispositionReport();
const summary = summarizeMigrationDispositionReport(report);

if (asJson) {
  if (bucket && (bucket === "redirectLater" || bucket === "keepForNow" || bucket === "review")) {
    console.log(
      JSON.stringify(
        {
          summary,
          bucket,
          rows: report[bucket],
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  console.log(JSON.stringify({ summary, report }, null, 2));
  process.exit(0);
}

console.log("Migration disposition summary");
console.log(JSON.stringify(summary, null, 2));

if (bucket && (bucket === "redirectLater" || bucket === "keepForNow" || bucket === "review")) {
  console.log(`\n${bucket} rows`);
  for (const row of report[bucket]) {
    console.log(
      `- ${row.topicKey} | priority=${row.priority} | owner=${row.recommendedOwner} | rationale=${row.rationale}`,
    );
  }
  process.exit(0);
}

for (const name of ["redirectLater", "keepForNow", "review"] as const) {
  const rows = report[name].slice(0, 10);
  console.log(`\n${name} samples`);
  for (const row of rows) {
    console.log(
      `- ${row.topicKey} | priority=${row.priority} | owner=${row.recommendedOwner} | overlap=${row.overlapType}`,
    );
  }
}
