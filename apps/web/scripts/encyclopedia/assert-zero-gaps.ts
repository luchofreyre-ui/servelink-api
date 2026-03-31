import { execSync } from "node:child_process";

const out = execSync("npm run report:evidence-coverage", { encoding: "utf-8" });

const hasGaps = /Corpus gaps.*:\s*(?!0\b)\d+/.test(out);
const hasOffTax = /Live pages \(off-taxonomy\):\s*(?!0\b)\d+/.test(out);

if (hasGaps || hasOffTax) {
  console.error("❌ Regression detected in coverage:");
  console.error(out);
  process.exit(1);
}

console.log("✅ Coverage invariant holds (0 gaps, 0 off-taxonomy)");

