/**
 * Print executable Next redirects derived from the encyclopedia manifest.
 * Run from apps/web: npm run plan:encyclopedia-redirect-execution
 *
 * Options:
 *   --json
 */
import { buildExecutableEncyclopediaRedirects } from "../../src/lib/encyclopedia/redirectExecution";

const redirects = buildExecutableEncyclopediaRedirects();
const asJson = process.argv.includes("--json");

if (asJson) {
  console.log(JSON.stringify({ total: redirects.length, redirects }, null, 2));
  process.exit(0);
}

console.log(`total executable redirects: ${redirects.length}`);
for (const r of redirects) {
  console.log(`${r.source} -> ${r.destination} permanent=${r.permanent}`);
}
