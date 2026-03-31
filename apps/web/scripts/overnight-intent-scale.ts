import fs from "fs";
import path from "path";
import { execSync } from "child_process";

type CandidateRow = {
  id?: string;
  slug?: string;
  normalizedSlug?: string;
  title?: string;
  recommendation?: string;
  manualOverrideRecommendation?: string;
};

type CandidateFileShape =
  | CandidateRow[]
  | {
      candidates?: CandidateRow[];
      items?: CandidateRow[];
      rows?: CandidateRow[];
    };

type MasterIndexEntry = {
  id?: string;
  slug?: string;
  normalizedSlug?: string;
  title?: string;
};

type MasterIndexShape =
  | MasterIndexEntry[]
  | {
      items?: MasterIndexEntry[];
      pages?: MasterIndexEntry[];
      entries?: MasterIndexEntry[];
    };

const INPUT_FILE = path.resolve(
  process.cwd(),
  "content-batches/encyclopedia/generated-expanded-reviewed-index-candidates.fresh-intents.json",
);

const EDITED_FILE = path.resolve(
  process.cwd(),
  "content-batches/encyclopedia/generated-expanded-reviewed-index-candidates.overnight.json",
);

const MASTER_INDEX_FILE = path.resolve(
  process.cwd(),
  "src/content/encyclopedia/_index/master-index.json",
);

const LOG_FILE = path.resolve(
  process.cwd(),
  "content-batches/encyclopedia/reports/overnight-scale.log",
);

const BATCH_SIZE = 300;
const MAX_CYCLES = 20;
const MAX_PER_INTENT_BUCKET = 80;
const MAX_PER_SURFACE = 8;
const GENERATE_INPUT = "content-batches/encyclopedia/batch-021.enriched.json";

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(line);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
}

function getCandidateRows(data: CandidateFileShape): CandidateRow[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.candidates)) return data.candidates;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

function withUpdatedCandidateRows(
  original: CandidateFileShape,
  rows: CandidateRow[],
): CandidateFileShape {
  if (Array.isArray(original)) return rows;
  if (Array.isArray(original.candidates)) return { ...original, candidates: rows };
  if (Array.isArray(original.items)) return { ...original, items: rows };
  if (Array.isArray(original.rows)) return { ...original, rows: rows };
  return { candidates: rows };
}

function getMasterIndexRows(data: MasterIndexShape): MasterIndexEntry[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.pages)) return data.pages;
  if (Array.isArray(data.entries)) return data.entries;
  return [];
}

function normalize(value: string | undefined): string {
  return (value || "").trim().toLowerCase();
}

function isSearchIntent(title: string | undefined): boolean {
  const t = normalize(title);
  if (!t) return false;

  const startsValid =
    t.startsWith("why ") ||
    t.startsWith("what ") ||
    t.startsWith("how ");

  if (!startsValid) return false;

  const problemLayerPattern =
    t.startsWith("heavy ") ||
    t.startsWith("light ") ||
    t.startsWith("severe ") ||
    ((t.includes(" on ") || t.includes(" for ")) &&
      (t.includes("heavy ") || t.includes("light ") || t.includes("severe ")));

  if (problemLayerPattern) return false;

  return true;
}

function classifyIntentBucket(title: string | undefined): string {
  const t = normalize(title);

  if (t.startsWith("why ")) return "why";
  if (t.startsWith("what causes ")) return "what-causes";
  if (t.startsWith("what ")) return "what";
  if (t.startsWith("how to remove ")) return "how-remove";
  if (t.startsWith("how to clean ")) return "how-clean";
  if (t.startsWith("how to fix ")) return "how-fix";
  if (t.startsWith("how to prevent ")) return "how-prevent";
  if (t.startsWith("how to avoid ")) return "how-avoid";
  if (t.startsWith("how to maintain ")) return "how-maintain";
  return "other";
}

function extractSurfaceKey(title: string | undefined): string {
  const t = normalize(title);
  if (!t) return "unknown";

  const patterns = [
    /\bon ([a-z0-9 /-]+)$/i,
    /\bfrom ([a-z0-9 /-]+)$/i,
    /\bfor ([a-z0-9 /-]+)$/i,
    /\bto prevent ([a-z0-9 /-]+)$/i,
  ];

  for (const pattern of patterns) {
    const match = t.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  if (t.startsWith("how to maintain ")) {
    const match = t.match(/^how to maintain (.+?) to prevent /i);
    if (match?.[1]) return match[1].trim();
  }

  return "unknown";
}

function buildIndexedSets(masterRows: MasterIndexEntry[]) {
  const indexedIds = new Set<string>();
  const indexedSlugs = new Set<string>();
  const indexedTitles = new Set<string>();

  for (const row of masterRows) {
    const id = normalize(row.id);
    const slug = normalize(row.slug);
    const normalizedSlug = normalize(row.normalizedSlug);
    const title = normalize(row.title);

    if (id) indexedIds.add(id);
    if (slug) indexedSlugs.add(slug);
    if (normalizedSlug) indexedSlugs.add(normalizedSlug);
    if (title) indexedTitles.add(title);
  }

  return { indexedIds, indexedSlugs, indexedTitles };
}

function isAlreadyIndexed(
  row: CandidateRow,
  indexedIds: Set<string>,
  indexedSlugs: Set<string>,
  indexedTitles: Set<string>,
): boolean {
  const id = normalize(row.id);
  const slug = normalize(row.slug);
  const normalizedSlug = normalize(row.normalizedSlug);
  const title = normalize(row.title);

  return Boolean(
    (id && indexedIds.has(id)) ||
      (slug && indexedSlugs.has(slug)) ||
      (normalizedSlug && indexedSlugs.has(normalizedSlug)) ||
      (title && indexedTitles.has(title)),
  );
}

function clearManualOverrides(rows: CandidateRow[]): CandidateRow[] {
  return rows.map((row) => {
    if (!("manualOverrideRecommendation" in row)) return row;
    const { manualOverrideRecommendation, ...rest } = row;
    return rest;
  });
}

function buildSelectionPool(
  rows: CandidateRow[],
  indexedIds: Set<string>,
  indexedSlugs: Set<string>,
  indexedTitles: Set<string>,
): CandidateRow[] {
  const seenKeys = new Set<string>();
  const out: CandidateRow[] = [];

  for (const row of rows) {
    const id = normalize(row.id);
    const slug = normalize(row.slug);
    const normalizedSlug = normalize(row.normalizedSlug);
    const title = normalize(row.title);
    const key = `${id}::${slug}::${normalizedSlug}::${title}`;

    if (seenKeys.has(key)) continue;
    if (row.recommendation !== "review") continue;
    if (!isSearchIntent(row.title)) continue;
    if (isAlreadyIndexed(row, indexedIds, indexedSlugs, indexedTitles)) continue;

    seenKeys.add(key);
    out.push(row);
  }

  return out;
}

function logStartupDiagnostics(
  rows: CandidateRow[],
  indexedIds: Set<string>,
  indexedSlugs: Set<string>,
  indexedTitles: Set<string>,
) {
  const totalRows = rows.length;
  const reviewRows = rows.filter((row) => row.recommendation === "review");
  const promoteRows = rows.filter((row) => row.recommendation === "promote");

  const reviewIntentRows = reviewRows.filter((row) => isSearchIntent(row.title));
  const reviewIntentNotInMaster = reviewIntentRows.filter(
    (row) => !isAlreadyIndexed(row, indexedIds, indexedSlugs, indexedTitles),
  );

  const promoteIntentRows = promoteRows.filter((row) => isSearchIntent(row.title));
  const promoteIntentNotInMaster = promoteIntentRows.filter(
    (row) => !isAlreadyIndexed(row, indexedIds, indexedSlugs, indexedTitles),
  );

  const promoteNonIntentNotInMaster = promoteRows.filter(
    (row) =>
      !isSearchIntent(row.title) &&
      !isAlreadyIndexed(row, indexedIds, indexedSlugs, indexedTitles),
  );

  log(
    `Startup diagnostics | totalRows=${totalRows} | review=${reviewRows.length} | promote=${promoteRows.length} | reviewIntent=${reviewIntentRows.length} | reviewIntentNotInMaster=${reviewIntentNotInMaster.length} | promoteIntent=${promoteIntentRows.length} | promoteIntentNotInMaster=${promoteIntentNotInMaster.length} | promoteNonIntentNotInMaster=${promoteNonIntentNotInMaster.length}`,
  );
}

function selectFreshPromotions(pool: CandidateRow[]): CandidateRow[] {
  const bucketCounts = new Map<string, number>();
  const surfaceCounts = new Map<string, number>();
  const selected: CandidateRow[] = [];

  const bucketPriority = [
    "why",
    "what-causes",
    "how-remove",
    "how-fix",
    "how-prevent",
    "how-clean",
    "how-avoid",
    "how-maintain",
    "what",
    "other",
  ];

  const grouped = new Map<string, CandidateRow[]>();
  for (const bucket of bucketPriority) grouped.set(bucket, []);

  for (const row of pool) {
    const bucket = classifyIntentBucket(row.title);
    if (!grouped.has(bucket)) grouped.set(bucket, []);
    grouped.get(bucket)!.push(row);
  }

  let addedInPass = true;

  while (selected.length < BATCH_SIZE && addedInPass) {
    addedInPass = false;

    for (const bucket of bucketPriority) {
      if (selected.length >= BATCH_SIZE) break;

      const rows = grouped.get(bucket) || [];
      if (rows.length === 0) continue;

      const currentBucketCount = bucketCounts.get(bucket) || 0;
      if (currentBucketCount >= MAX_PER_INTENT_BUCKET) continue;

      let chosenIndex = -1;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const surfaceKey = extractSurfaceKey(row.title);
        const currentSurfaceCount = surfaceCounts.get(surfaceKey) || 0;

        if (currentSurfaceCount < MAX_PER_SURFACE) {
          chosenIndex = i;
          break;
        }
      }

      if (chosenIndex === -1) continue;

      const [chosen] = rows.splice(chosenIndex, 1);
      selected.push(chosen);

      const bucketCount = bucketCounts.get(bucket) || 0;
      bucketCounts.set(bucket, bucketCount + 1);

      const surfaceKey = extractSurfaceKey(chosen.title);
      const surfaceCount = surfaceCounts.get(surfaceKey) || 0;
      surfaceCounts.set(surfaceKey, surfaceCount + 1);

      addedInPass = true;
    }
  }

  return selected;
}

function applyPromotions(
  rows: CandidateRow[],
  selected: CandidateRow[],
): CandidateRow[] {
  const selectedKeys = new Set(
    selected.map((row) => {
      const id = normalize(row.id);
      const slug = normalize(row.slug);
      const normalizedSlug = normalize(row.normalizedSlug);
      const title = normalize(row.title);
      return `${id}::${slug}::${normalizedSlug}::${title}`;
    }),
  );

  return clearManualOverrides(rows).map((row) => {
    const id = normalize(row.id);
    const slug = normalize(row.slug);
    const normalizedSlug = normalize(row.normalizedSlug);
    const title = normalize(row.title);
    const key = `${id}::${slug}::${normalizedSlug}::${title}`;

    if (selectedKeys.has(key)) {
      return {
        ...row,
        manualOverrideRecommendation: "promote",
      };
    }

    return row;
  });
}

function parseAppendedCount(stdout: string): number | null {
  const patterns = [
    /appendedCount["':\s]+(\d+)/i,
    /"appendedCount"\s*:\s*(\d+)/i,
    /\bappendedCount\s+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = stdout.match(pattern);
    if (match?.[1]) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) return value;
    }
  }

  return null;
}

function runCycle(cycle: number): number {
  log(`--- CYCLE ${cycle} START ---`);

  const inputData = readJson<CandidateFileShape>(INPUT_FILE);
  const rows = getCandidateRows(inputData);

  const masterData = readJson<MasterIndexShape>(MASTER_INDEX_FILE);
  const masterRows = getMasterIndexRows(masterData);
  const { indexedIds, indexedSlugs, indexedTitles } = buildIndexedSets(masterRows);

  if (cycle === 1) {
    logStartupDiagnostics(rows, indexedIds, indexedSlugs, indexedTitles);
  }

  const pool = buildSelectionPool(rows, indexedIds, indexedSlugs, indexedTitles);
  const selected = selectFreshPromotions(pool);

  log(`Fresh promotable rows found: ${selected.length}`);

  if (selected.length === 0) {
    log("No fresh promotable rows left. Stopping.");
    return 0;
  }

  const editedRows = applyPromotions(rows, selected);
  const editedData = withUpdatedCandidateRows(inputData, editedRows);
  writeJson(EDITED_FILE, editedData);

  const stdout = execSync(
    `npm run promote:index-candidates -- --input="${EDITED_FILE}" --recommendation=promote --require-search-intent-titles --limit=${BATCH_SIZE}`,
    { encoding: "utf-8" },
  );

  process.stdout.write(stdout);

  const appendedCount = parseAppendedCount(stdout);
  log(`Cycle ${cycle} appendedCount: ${appendedCount ?? "unknown"}`);

  if (appendedCount === 0) {
    log("Cycle produced appendedCount 0. Stopping to avoid useless repeats.");
    return 0;
  }

  execSync(`npm run generate:encyclopedia -- ${GENERATE_INPUT}`, {
    stdio: "inherit",
  });

  execSync(`npm run build`, { stdio: "inherit" });

  log(`--- CYCLE ${cycle} COMPLETE ---`);
  return appendedCount ?? 1;
}

function main() {
  log("=== OVERNIGHT SCALE START ===");

  let totalAppended = 0;

  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    const appended = runCycle(cycle);
    if (appended <= 0) break;
    totalAppended += appended;
    log(`Running total appendedCount: ${totalAppended}`);
  }

  log(`=== OVERNIGHT SCALE COMPLETE | total appendedCount: ${totalAppended} ===`);
}

main();
