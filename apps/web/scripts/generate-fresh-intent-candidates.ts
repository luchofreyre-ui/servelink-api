import fs from "fs";
import path from "path";

type CandidateRow = {
  id?: string;
  slug?: string;
  normalizedSlug?: string;
  normalizedTitle?: string;
  title?: string;
  recommendation?: string;
  manualOverrideRecommendation?: string;
  cluster?: string;
  problem?: string;
  surface?: string;
  sourceType?: string;
  category?: string;
  role?: string;
  status?: string;
  generatedType?: string;
  scorerRecommendation?: string;
  [key: string]: unknown;
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
  normalizedTitle?: string;
};

type MasterIndexShape =
  | MasterIndexEntry[]
  | {
      items?: MasterIndexEntry[];
      pages?: MasterIndexEntry[];
      entries?: MasterIndexEntry[];
    };

const SOURCE_FILE = path.resolve(
  process.cwd(),
  "content-batches/encyclopedia/generated-expanded-reviewed-index-candidates.json",
);

const OUTPUT_FILE = path.resolve(
  process.cwd(),
  "content-batches/encyclopedia/generated-expanded-reviewed-index-candidates.fresh-intents.json",
);

const MASTER_INDEX_FILE = path.resolve(
  process.cwd(),
  "src/content/encyclopedia/_index/master-index.json",
);

const MAX_OUTPUT = 4000;

const MAX_PER_SURFACE = 20;
const MAX_PER_PROBLEM = 24;
const MAX_PER_PROBLEM_SURFACE = 6;

const MAX_PER_BUCKET: Record<string, number> = {
  why: 350,
  "what-causes": 450,
  diagnosis: 350,
  "how-prevent": 400,
  "how-maintain": 250,
  "mistake-recovery": 250,
  "how-remove": 350,
  "how-clean": 250,
  "how-fix": 300,
  "how-avoid": 150,
};

const BUCKET_PRIORITY = [
  "what-causes",
  "how-remove",
  "how-prevent",
  "how-fix",
  "diagnosis",
  "why",
  "how-clean",
  "how-maintain",
  "mistake-recovery",
  "how-avoid",
] as const;

const INTENT_PREFIX_RE =
  /^(why|what|how)\b|^what causes\b|^how to\b|^how do i\b|^how can i\b/i;

const SEVERITY_WORD_RE =
  /\b(heavy|light|severe|moderate|minor|major|mild|extreme|serious|slight)\b/gi;

const BAD_PROBLEM_PATTERNS: RegExp[] = [
  /^why\b/i,
  /^what\b/i,
  /^how\b/i,
  /^how to\b/i,
  /^how do i\b/i,
  /^how can i\b/i,
  /^what causes\b/i,
  /\bafter using\b/i,
  /\bto prevent\b/i,
  /\bfrom looking\b/i,
  /\bwrong cleaner\b/i,
];

const BAD_TITLE_PATTERNS: RegExp[] = [
  /\bhow to prevent how to\b/i,
  /\bhow to avoid how to\b/i,
  /\bhow to maintain .* to prevent how to\b/i,
  /\bwhy does .* happen on how to\b/i,
  /\bwhat causes .* on how to\b/i,
  /\bhow to (remove|clean|fix|prevent|avoid) how to\b/i,
  /\bmoderate\b/i,
  /\bminor\b/i,
  /\bmild\b/i,
];

const IRREGULAR_SINGULARS: Record<string, string> = {
  "hard water stains": "hard water stains",
  stains: "stains",
  streaks: "streaks",
  odors: "odor",
  residues: "residue",
  fixtures: "fixtures",
  appliances: "appliances",
  backsplashes: "backsplashes",
  baseboards: "baseboards",
  cabinets: "cabinets",
  countertops: "countertops",
  floors: "floors",
  walls: "walls",
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
}

function normalize(value: string | undefined): string {
  return (value || "").trim().toLowerCase();
}

function titleCaseWord(word: string): string {
  if (!word) return word;
  const keepUpper = new Set(["ph", "uv", "ac"]);
  if (keepUpper.has(word.toLowerCase())) return word.toUpperCase();
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function toTitleCase(value: string): string {
  const lowerWords = new Set([
    "and",
    "or",
    "to",
    "on",
    "in",
    "of",
    "for",
    "from",
    "if",
    "is",
    "the",
    "a",
    "an",
    "after",
    "using",
  ]);

  return value
    .split(" ")
    .filter(Boolean)
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index > 0 && lowerWords.has(lower)) return lower;
      return titleCaseWord(lower);
    })
    .join(" ");
}

function slugify(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

function buildIndexedSets(masterRows: MasterIndexEntry[]) {
  const indexedSlugs = new Set<string>();
  const indexedTitles = new Set<string>();

  for (const row of masterRows) {
    const slug = normalize(row.slug);
    const normalizedSlug = normalize(row.normalizedSlug);
    const title = normalize(row.title);
    const normalizedTitle = normalize(row.normalizedTitle);

    if (slug) indexedSlugs.add(slug);
    if (normalizedSlug) indexedSlugs.add(normalizedSlug);
    if (title) indexedTitles.add(title);
    if (normalizedTitle) indexedTitles.add(normalizedTitle);
  }

  return { indexedSlugs, indexedTitles };
}

function isSearchIntent(title: string | undefined): boolean {
  const t = normalize(title);
  return t.startsWith("why ") || t.startsWith("what ") || t.startsWith("how ");
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripSeverityWords(value: string): string {
  return collapseWhitespace(value.replace(SEVERITY_WORD_RE, " "));
}

function singularizeProblem(problem: string): string {
  const p = normalize(problem);

  if (IRREGULAR_SINGULARS[p]) return IRREGULAR_SINGULARS[p];
  if (p.endsWith("buildup")) return p;
  if (p.endsWith("scale")) return p;
  if (p.endsWith("scum")) return p;
  if (p.endsWith("haze")) return p;
  if (p.endsWith("dullness")) return p;
  if (p.endsWith("discoloration")) return p;
  if (p.endsWith("streaking")) return p;
  if (p.endsWith("limescale")) return p;
  if (p.endsWith("soap scum")) return p;
  if (p.endsWith("hard water stains")) return p;

  if (p.endsWith("s") && !p.endsWith("ss")) {
    return p.slice(0, -1);
  }

  return p;
}

function sanitizeProblemPhrase(problem: string | null): string | null {
  let cleaned = normalize(problem || undefined);
  if (!cleaned) return null;

  cleaned = stripSeverityWords(cleaned);

  let previous = "";
  while (cleaned && cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned
      .replace(/^(how to avoid|how to prevent|how to remove|how to clean|how to fix|how to maintain)\s+/i, "")
      .replace(/^(what causes|what does|why does|why do|how to tell if|how to tell whether)\s+/i, "")
      .replace(/^(how to)\s+/i, "")
      .trim();
  }

  cleaned = cleaned
    .replace(/\bis permanent\b/gi, "")
    .replace(/\bafter using the wrong cleaner\b/gi, "")
    .replace(/\bafter using\b.*$/gi, "")
    .replace(/\bfrom\b.*$/gi, "")
    .replace(/\bon\b.*$/gi, "")
    .replace(/\bto prevent\b.*$/gi, "")
    .replace(/\bmean\b$/gi, "")
    .trim();

  cleaned = stripSeverityWords(cleaned);
  cleaned = singularizeProblem(cleaned);
  cleaned = collapseWhitespace(cleaned);

  if (!cleaned) return null;
  if (INTENT_PREFIX_RE.test(cleaned)) return null;
  if (BAD_PROBLEM_PATTERNS.some((pattern) => pattern.test(cleaned))) return null;
  if (cleaned.length < 3) return null;
  if (cleaned.split(" ").length > 5) return null;

  return cleaned;
}

function sanitizeSurfacePhrase(surface: string | null): string | null {
  let cleaned = normalize(surface || undefined);
  if (!cleaned) return null;

  cleaned = cleaned
    .replace(/^the\s+/, "")
    .replace(/\bafter using\b.*$/gi, "")
    .replace(/\bis permanent\b/gi, "")
    .trim();

  cleaned = collapseWhitespace(cleaned);

  if (!cleaned) return null;
  if (INTENT_PREFIX_RE.test(cleaned)) return null;
  if (cleaned.length < 3) return null;
  if (cleaned.split(" ").length > 4) return null;

  return cleaned;
}

function isValidProblemSurface(problem: string | null, surface: string | null): boolean {
  if (!problem || !surface) return false;
  if (problem === surface) return false;
  if (problem.includes(surface) || surface.includes(problem)) return false;
  if (INTENT_PREFIX_RE.test(problem) || INTENT_PREFIX_RE.test(surface)) return false;
  return true;
}

function extractProblemAndSurface(title: string | undefined): {
  problem: string | null;
  surface: string | null;
} {
  const t = normalize(title);
  if (!t) return { problem: null, surface: null };

  const working = stripSeverityWords(t);
  const match = working.match(/^(.+?)\s+on\s+(.+)$/);

  if (!match) return { problem: null, surface: null };

  const problem = sanitizeProblemPhrase(match[1]?.trim() || null);
  const surface = sanitizeSurfacePhrase(match[2]?.trim() || null);

  return isValidProblemSurface(problem, surface)
    ? { problem, surface }
    : { problem: null, surface: null };
}

function extractProblemSurfaceFromIntent(title: string | undefined): {
  problem: string | null;
  surface: string | null;
} {
  const t = normalize(title);
  if (!t) return { problem: null, surface: null };

  const patterns: Array<{
    pattern: RegExp;
    mode: "problem-surface" | "surface-problem";
  }> = [
    { pattern: /^why do (.+?) happen on (.+)$/, mode: "problem-surface" },
    { pattern: /^why does (.+?) happen on (.+)$/, mode: "problem-surface" },
    { pattern: /^what causes (.+?) on (.+)$/, mode: "problem-surface" },
    { pattern: /^how to remove (.+?) from (.+)$/, mode: "problem-surface" },
    { pattern: /^how to clean (.+?) from (.+)$/, mode: "problem-surface" },
    { pattern: /^how to fix (.+?) on (.+)$/, mode: "problem-surface" },
    { pattern: /^how to prevent (.+?) on (.+)$/, mode: "problem-surface" },
    { pattern: /^how to avoid (.+?) on (.+)$/, mode: "problem-surface" },
    { pattern: /^how to maintain (.+?) to prevent (.+)$/, mode: "surface-problem" },
    { pattern: /^how to tell if (.+?) on (.+?) is permanent$/, mode: "problem-surface" },
    { pattern: /^how to tell whether (.+?) on (.+?) is permanent$/, mode: "problem-surface" },
    { pattern: /^what does (.+?) on (.+?) mean$/, mode: "problem-surface" },
    { pattern: /^how to fix (.+?) on (.+?) after using (.+)$/, mode: "problem-surface" },
  ];

  for (const entry of patterns) {
    const match = t.match(entry.pattern);
    if (!match) continue;

    const rawProblem =
      entry.mode === "surface-problem"
        ? match[2]?.trim() || null
        : match[1]?.trim() || null;

    const rawSurface =
      entry.mode === "surface-problem"
        ? match[1]?.trim() || null
        : match[2]?.trim() || null;

    const problem = sanitizeProblemPhrase(rawProblem);
    const surface = sanitizeSurfacePhrase(rawSurface);

    if (isValidProblemSurface(problem, surface)) {
      return { problem, surface };
    }
  }

  return { problem: null, surface: null };
}

function classifyBucket(title: string): string {
  const t = normalize(title);

  if (t.startsWith("what causes ")) return "what-causes";
  if (t.startsWith("why ")) return "why";
  if (
    t.startsWith("how to tell if ") ||
    t.startsWith("how to tell whether ") ||
    t.startsWith("what does ")
  ) {
    return "diagnosis";
  }
  if (
    t.startsWith("how to fix ") &&
    (t.includes(" after using ") || t.includes(" after cleaning "))
  ) {
    return "mistake-recovery";
  }
  if (t.startsWith("how to remove ")) return "how-remove";
  if (t.startsWith("how to clean ")) return "how-clean";
  if (t.startsWith("how to fix ")) return "how-fix";
  if (t.startsWith("how to prevent ")) return "how-prevent";
  if (t.startsWith("how to avoid ")) return "how-avoid";
  if (t.startsWith("how to maintain ")) return "how-maintain";
  return "other";
}

function usePluralWhy(problem: string): boolean {
  const p = normalize(problem);
  return (
    p.endsWith("stains") ||
    p.endsWith("streaks") ||
    p.endsWith("marks") ||
    p.endsWith("spots")
  );
}

function buildFreshIntentTitles(problem: string, surface: string): string[] {
  const whyLine = usePluralWhy(problem)
    ? `Why do ${problem} happen on ${surface}`
    : `Why does ${problem} happen on ${surface}`;

  return [
    `What causes ${problem} on ${surface}`,
    whyLine,
    `How to tell if ${problem} on ${surface} is permanent`,
    `What does ${problem} on ${surface} mean`,
    `How to prevent ${problem} on ${surface}`,
    `How to maintain ${surface} to prevent ${problem}`,
    `How to remove ${problem} from ${surface}`,
    `How to clean ${problem} from ${surface}`,
    `How to fix ${problem} on ${surface}`,
    `How to avoid ${problem} on ${surface}`,
    `How to fix ${problem} on ${surface} after using the wrong cleaner`,
  ];
}

function normalizeLanguageQuality(title: string): string {
  let t = normalize(title);

  t = stripSeverityWords(t);
  t = collapseWhitespace(t);

  t = t
    .replace(/^why does hard water stains\b/i, "why do hard water stains")
    .replace(/^why does (.+s) happen\b/i, "why do $1 happen")
    .replace(/\bhow to avoid\b/i, "how to prevent");

  t = collapseWhitespace(t);
  return t;
}

function isNaturalEnough(title: string): boolean {
  const t = normalizeLanguageQuality(title);
  if (!t) return false;
  if (!isSearchIntent(t)) return false;
  if (BAD_TITLE_PATTERNS.some((pattern) => pattern.test(t))) return false;
  if (/\bhow to\b.*\bhow to\b/i.test(t)) return false;
  if (/\bwhat causes what causes\b/i.test(t)) return false;
  if (/\bwhy does why does\b/i.test(t)) return false;
  if (/\bmoderate\b|\bminor\b|\bmild\b/i.test(t)) return false;
  if (t.split(" ").length < 5) return false;
  return true;
}

function uniqueProblemSurfacePairs(rows: CandidateRow[]) {
  const pairs = new Map<string, { problem: string; surface: string }>();

  for (const row of rows) {
    const title = normalize(row.title);
    const pair = isSearchIntent(title)
      ? extractProblemSurfaceFromIntent(row.title)
      : extractProblemAndSurface(row.title);

    if (!pair.problem || !pair.surface) continue;

    const problem = normalize(pair.problem);
    const surface = normalize(pair.surface);
    const key = `${problem}::${surface}`;

    if (!pairs.has(key)) {
      pairs.set(key, { problem, surface });
    }
  }

  return Array.from(pairs.values());
}

function main() {
  const sourceData = readJson<CandidateFileShape>(SOURCE_FILE);
  const sourceRows = getCandidateRows(sourceData);

  const masterData = readJson<MasterIndexShape>(MASTER_INDEX_FILE);
  const masterRows = getMasterIndexRows(masterData);
  const { indexedSlugs, indexedTitles } = buildIndexedSets(masterRows);

  const existingCandidateTitles = new Set<string>();
  const existingCandidateSlugs = new Set<string>();

  for (const row of sourceRows) {
    const title = normalize(row.title);
    const normalizedTitle = normalize(row.normalizedTitle);
    const slug = normalize(row.slug);
    const normalizedSlug = normalize(row.normalizedSlug);

    if (title) existingCandidateTitles.add(title);
    if (normalizedTitle) existingCandidateTitles.add(normalizedTitle);
    if (slug) existingCandidateSlugs.add(slug);
    if (normalizedSlug) existingCandidateSlugs.add(normalizedSlug);
  }

  const pairs = uniqueProblemSurfacePairs(sourceRows);

  const groupedByBucket = new Map<string, CandidateRow[]>();
  for (const bucket of BUCKET_PRIORITY) groupedByBucket.set(bucket, []);

  const createdTitles = new Set<string>();
  const createdSlugs = new Set<string>();

  let syntheticIndex = 1;

  for (const { problem, surface } of pairs) {
    const titles = buildFreshIntentTitles(problem, surface);

    for (const rawTitle of titles) {
      const normalizedTitle = normalizeLanguageQuality(rawTitle);
      const slug = slugify(normalizedTitle);
      const bucket = classifyBucket(normalizedTitle);

      if (!isNaturalEnough(normalizedTitle)) continue;
      if (!MAX_PER_BUCKET[bucket]) continue;
      if (indexedTitles.has(normalizedTitle)) continue;
      if (indexedSlugs.has(slug)) continue;
      if (existingCandidateTitles.has(normalizedTitle)) continue;
      if (existingCandidateSlugs.has(slug)) continue;
      if (createdTitles.has(normalizedTitle)) continue;
      if (createdSlugs.has(slug)) continue;

      createdTitles.add(normalizedTitle);
      createdSlugs.add(slug);

      const row: CandidateRow = {
        id: `FRESH-INTENT-${String(syntheticIndex).padStart(5, "0")}`,
        slug,
        normalizedSlug: slug,
        title: toTitleCase(normalizedTitle),
        normalizedTitle,
        recommendation: "review",
        cluster: "search-intent",
        problem: toTitleCase(problem),
        surface: toTitleCase(surface),
        sourceType: "synthetic-intent-expansion",
        category: "problems",
        role: "supporting",
        status: "draft",
        generatedType: "problem_surface",
        scorerRecommendation: "review",
      };

      groupedByBucket.get(bucket)?.push(row);
      syntheticIndex += 1;
    }
  }

  const bucketCounts = new Map<string, number>();
  const surfaceCounts = new Map<string, number>();
  const problemCounts = new Map<string, number>();
  const pairCounts = new Map<string, number>();

  const selected: CandidateRow[] = [];

  let madeProgress = true;
  while (selected.length < MAX_OUTPUT && madeProgress) {
    madeProgress = false;

    for (const bucket of BUCKET_PRIORITY) {
      if (selected.length >= MAX_OUTPUT) break;

      const bucketRows = groupedByBucket.get(bucket) || [];
      if (bucketRows.length === 0) continue;

      const currentBucketCount = bucketCounts.get(bucket) || 0;
      if (currentBucketCount >= MAX_PER_BUCKET[bucket]) continue;

      let chosenIndex = -1;

      for (let i = 0; i < bucketRows.length; i++) {
        const row = bucketRows[i];
        const problem = normalize(row.problem);
        const surface = normalize(row.surface);
        const pairKey = `${problem}::${surface}`;

        const currentProblemCount = problemCounts.get(problem) || 0;
        const currentSurfaceCount = surfaceCounts.get(surface) || 0;
        const currentPairCount = pairCounts.get(pairKey) || 0;

        if (currentProblemCount >= MAX_PER_PROBLEM) continue;
        if (currentSurfaceCount >= MAX_PER_SURFACE) continue;
        if (currentPairCount >= MAX_PER_PROBLEM_SURFACE) continue;

        chosenIndex = i;
        break;
      }

      if (chosenIndex === -1) continue;

      const [chosen] = bucketRows.splice(chosenIndex, 1);
      selected.push(chosen);

      const problem = normalize(chosen.problem);
      const surface = normalize(chosen.surface);
      const pairKey = `${problem}::${surface}`;

      bucketCounts.set(bucket, currentBucketCount + 1);
      problemCounts.set(problem, (problemCounts.get(problem) || 0) + 1);
      surfaceCounts.set(surface, (surfaceCounts.get(surface) || 0) + 1);
      pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);

      madeProgress = true;
    }
  }

  const outputData = withUpdatedCandidateRows(sourceData, selected);
  writeJson(OUTPUT_FILE, outputData);

  console.log(
    JSON.stringify(
      {
        sourceRows: sourceRows.length,
        problemSurfacePairs: pairs.length,
        freshCandidateCount: selected.length,
        bucketCounts: Object.fromEntries(bucketCounts),
        outputFile: path.relative(process.cwd(), OUTPUT_FILE),
      },
      null,
      2,
    ),
  );
}

main();
