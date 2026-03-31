/**
 * Batch-2 planning: manifest vs live redirects (read-only).
 * Run from apps/web: npm run plan:encyclopedia-redirect-batch-review
 *
 * Options: --json
 */
import {
  buildRedirectBatchReviewReport,
  summarizeRedirectBatchReviewReport,
} from "../../src/lib/encyclopedia/redirectBatchReview";

const asJson = process.argv.includes("--json");
const report = buildRedirectBatchReviewReport();
const summary = summarizeRedirectBatchReviewReport(report);

if (asJson) {
  console.log(JSON.stringify({ summary, report }, null, 2));
  process.exit(0);
}

console.log("Encyclopedia redirect batch review (planning only)");
console.log(JSON.stringify(summary, null, 2));
console.log("");
for (const item of report.items) {
  console.log(
    `- ${item.topicKey} | ${item.sourceHref} → ${item.destinationHref} | ` +
      `executed=${item.alreadyExecuted} | action=${item.recommendedBatchAction} | priority=${item.priority}`,
  );
}
