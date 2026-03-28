/**
 * Bridge map planner (stdout). Run from apps/web:
 *   npm run plan:encyclopedia-bridges
 *   npm run plan:encyclopedia-bridges -- --json
 *   npm run plan:encyclopedia-bridges -- --bucket=bridgeNow
 */
import {
  buildBridgeMap,
  getBuiltBridgeMap,
  type BridgeMap,
  type BridgeItem,
} from "../../src/lib/encyclopedia/bridgeMap";
import { getConvergenceAuditRows } from "../../src/lib/encyclopedia/convergenceAudit";

const wantJson = process.argv.includes("--json");
const bucketArg = process.argv.find((a) => a.startsWith("--bucket="));
const bucketName = bucketArg?.slice("--bucket=".length).trim() as
  | keyof BridgeMap
  | undefined;

const VALID_BUCKETS: (keyof BridgeMap)[] = [
  "bridgeNow",
  "redirectLater",
  "keepForNow",
  "review",
];

function counts(m: BridgeMap) {
  const bridgeNowWithPipeline = m.bridgeNow.filter((i) => Boolean(i.pipelineHref))
    .length;
  return {
    bridgeNow: m.bridgeNow.length,
    bridgeNowWithPipelineHref: bridgeNowWithPipeline,
    redirectLater: m.redirectLater.length,
    keepForNow: m.keepForNow.length,
    review: m.review.length,
  };
}

function sampleLines(items: BridgeItem[], limit: number): string {
  return items
    .slice(0, limit)
    .map(
      (r) =>
        `  ${r.topicKey}\n    pipeline: ${r.pipelineHref ?? "—"}\n    legacy: ${r.legacyHref ?? "—"}`,
    )
    .join("\n");
}

const rows = getConvergenceAuditRows();
const map = buildBridgeMap(rows);

if (wantJson) {
  const base = { counts: counts(map) };
  if (bucketName && VALID_BUCKETS.includes(bucketName)) {
    // eslint-disable-next-line no-console -- CLI
    console.log(
      JSON.stringify(
        { ...base, bucket: bucketName, rows: map[bucketName] },
        null,
        2,
      ),
    );
  } else {
    // eslint-disable-next-line no-console -- CLI
    console.log(JSON.stringify({ ...base, ...map }, null, 2));
  }
  void getBuiltBridgeMap();
  process.exit(0);
}

// eslint-disable-next-line no-console -- CLI
console.log(`
Encyclopedia bridge map (from convergence audit)
=================================================
${JSON.stringify(counts(map), null, 2)}
`);

if (bucketName && VALID_BUCKETS.includes(bucketName)) {
  // eslint-disable-next-line no-console -- CLI
  console.log(`--bucket=${bucketName} (${map[bucketName].length} rows)\n`);
  // eslint-disable-next-line no-console -- CLI
  console.log(sampleLines(map[bucketName], 200) || "  (empty)");
} else {
  if (bucketName) {
    // eslint-disable-next-line no-console -- CLI
    console.warn(
      `Unknown --bucket=${bucketName} (use bridgeNow | redirectLater | keepForNow | review)\n`,
    );
  }
  for (const key of VALID_BUCKETS) {
    // eslint-disable-next-line no-console -- CLI
    console.log(`${key} (sample up to 12)\n${sampleLines(map[key], 12) || "  (empty)"}\n`);
  }
}

// eslint-disable-next-line no-console -- CLI
console.log(
  "JSON: npm run plan:encyclopedia-bridges -- --json\nFilter:  npm run plan:encyclopedia-bridges -- --bucket=bridgeNow\n",
);

void getBuiltBridgeMap();
