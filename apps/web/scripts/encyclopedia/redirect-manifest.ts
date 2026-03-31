/**
 * Redirect manifest from migration disposition (planning only; no live redirects).
 * Run from apps/web: npm run plan:encyclopedia-redirects
 *
 * Options:
 *   --json
 *   --min-priority=high|medium|low   (default: high)
 */
import {
  buildRedirectManifest,
  summarizeRedirectManifest,
} from "../../src/lib/encyclopedia/redirectManifest";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const minArg = args.find((a) => a.startsWith("--min-priority="));
const minRaw = minArg?.split("=")[1];
const minPriority =
  minRaw === "high" || minRaw === "medium" || minRaw === "low" ? minRaw : undefined;

const manifest = buildRedirectManifest(
  minPriority !== undefined ? { minPriority } : undefined,
);
const summary = summarizeRedirectManifest(manifest);

if (asJson) {
  console.log(JSON.stringify({ summary, manifest }, null, 2));
  process.exit(0);
}

console.log("Encyclopedia redirect manifest (planning only)");
console.log(`total: ${summary.total}`);
console.log("by priority:", JSON.stringify(summary.byPriority));

const preview = manifest.items.slice(0, 20);
for (const row of preview) {
  console.log("");
  console.log(`- ${row.topicKey}`);
  console.log(`  ${row.sourceHref} -> ${row.destinationHref}`);
  console.log(`  priority=${row.priority}`);
  console.log(`  rationale=${row.rationale}`);
}
