/**
 * Corpus-gap-first encyclopedia pipeline only (no full-matrix net-new regeneration).
 *
 * Builds targets from GET /api/v1/encyclopedia/list vs the taxonomy matrix: matrix cells with
 * evidence whose canonical (surface, problem) pair is missing from the live corpus. If there are
 * no such gaps, generation is skipped.
 *
 * Run from apps/web: npm run run:full-encyclopedia
 * Write batch JSON only: npm run run:full-encyclopedia -- --seed-only
 * Optional: --api-base=http://host:port (API origin; `/api/v1` is appended)
 */

import { execSync } from "child_process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import {
  normalizeTaxonomyPart,
  TAXONOMY_PROBLEMS as PROBLEMS,
  TAXONOMY_SURFACES as SURFACES,
} from "../src/lib/encyclopedia/evidence/cleaningMatrixTaxonomy";
import { normalizeApiOrigin } from "../src/lib/env";
import {
  canonicalPairKey,
  resolveEvidence,
} from "../src/lib/encyclopedia/evidence/evidenceResolver";

type Intent =
  | "how-remove"
  | "how-clean"
  | "how-fix"
  | "how-prevent"
  | "what-causes"
  | "diagnosis"
  | "why"
  | "how-maintain"
  | "mistake-recovery";

const INTENT_SET = new Set<Intent>([
  "how-remove",
  "how-clean",
  "how-fix",
  "how-prevent",
  "what-causes",
  "diagnosis",
  "why",
  "how-maintain",
  "mistake-recovery",
]);

const PRODUCT_INTENTS: Intent[] = [
  "what-causes",
  "how-remove",
  "how-prevent",
  "how-fix",
  "how-clean",
  "diagnosis",
  "why",
  "how-maintain",
  "mistake-recovery",
];

type Target = { problem: string; surface: string; intents: Intent[] };

type PageRow = {
  id: string;
  title: string;
  slug: string;
  problem: string;
  surface: string;
  intent: Intent;
  riskLevel: "low" | "medium" | "high";
  status: "draft";
};

type PublicListItem = {
  slug?: string;
  title?: string;
  problem?: string;
  surface?: string;
  intent?: string;
};

const WEB_ROOT = process.cwd();
const API_ROOT = path.resolve(WEB_ROOT, "..", "..", "services", "api");

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}
const API_PIPELINE_DIR = path.join(
  WEB_ROOT,
  "content-batches",
  "encyclopedia",
  "api-pipeline",
);

const PAGES_PER_BATCH_FILE = 100;

/** Same intent + normalized problem + normalized surface (hard overlap rule). */
function comboKey(intent: string, problem: string, surface: string): string {
  return `${normalizeTaxonomyPart(intent)}::${normalizeTaxonomyPart(problem)}::${normalizeTaxonomyPart(surface)}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildTitle(intent: Intent, problem: string, surface: string) {
  switch (intent) {
    case "how-remove":
      return `How to Remove ${problem} from ${surface}`;
    case "how-clean":
      return `How to Clean ${problem} from ${surface}`;
    case "how-fix":
      return `How to Fix ${problem} on ${surface}`;
    case "how-prevent":
      return `How to Prevent ${problem} on ${surface}`;
    case "what-causes":
      return `What Causes ${problem} on ${surface}`;
    case "diagnosis":
      return `How to Tell if ${problem} on ${surface} is Permanent`;
    case "why":
      return `Why ${problem} Keeps Coming Back on ${surface}`;
    case "how-maintain":
      return `How to Maintain ${surface} and Keep ${problem} Under Control`;
    case "mistake-recovery":
      return `How to Recover After a Cleaning Mistake With ${problem} on ${surface}`;
    default: {
      const _e: never = intent;
      return _e;
    }
  }
}

function normalizeIntent(raw: string): Intent {
  const t = raw.trim() as Intent;
  if (!INTENT_SET.has(t)) {
    throw new Error(`Invalid intent "${raw}" (expected one of canonical intents)`);
  }
  return t;
}

async function fetchLiveList(apiBase: string): Promise<PublicListItem[]> {
  const url = `${apiBase.replace(/\/$/, "")}/encyclopedia/list`;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url, {
        // Reduce chance of stale keep-alive sockets causing EPIPE in long runs.
        headers: { Connection: "close" },
      });
      if (!res.ok) {
        throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as { ok?: boolean; items?: PublicListItem[] };
      if (!Array.isArray(data.items)) {
        throw new Error(`Unexpected encyclopedia list shape (missing items[])`);
      }
      return data.items;
    } catch (err) {
      lastError = err;
      // brief backoff then retry (undici can surface transient EPIPE)
      await sleep(150 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function buildCorpusGapFirstCandidates(apiBase: string): Promise<PageRow[]> {
  const items = await fetchLiveList(apiBase);

  const pageCanonicalKeys = new Set<string>();
  const existingCombos = new Set<string>();
  for (const item of items) {
    if (
      typeof item.intent !== "string" ||
      typeof item.problem !== "string" ||
      typeof item.surface !== "string"
    ) {
      continue;
    }
    existingCombos.add(comboKey(item.intent, item.problem, item.surface));
    pageCanonicalKeys.add(canonicalPairKey(item.surface, item.problem));
  }

  const accepted: PageRow[] = [];

  for (const problem of PROBLEMS) {
    for (const surface of SURFACES) {
      // Only prioritize matrix cells that already have evidence support.
      if (!resolveEvidence(surface, problem)) continue;

      const matrixKey = canonicalPairKey(surface, problem);
      if (pageCanonicalKeys.has(matrixKey)) continue;

      // Generate all intents for the missing (surface, problem) pair.
      for (const intent of PRODUCT_INTENTS) {
        const key = comboKey(intent, problem, surface);
        if (existingCombos.has(key)) continue;
        existingCombos.add(key);

        const title = buildTitle(intent, problem, surface);
        const slug = slugify(title);

        accepted.push({
          id: `${intent}::${surface}::${problem}`,
          title,
          slug,
          problem,
          surface,
          intent,
          riskLevel: "medium",
          status: "draft",
        });
      }
    }
  }

  return accepted;
}

function clearApiPipelineBatchJson() {
  if (!fileExists(API_PIPELINE_DIR)) return;
  for (const name of fs.readdirSync(API_PIPELINE_DIR)) {
    if (/^batch-\d+\.json$/i.test(name)) {
      fs.unlinkSync(path.join(API_PIPELINE_DIR, name));
    }
    if (name.endsWith(".resolved-targets.json")) {
      fs.unlinkSync(path.join(API_PIPELINE_DIR, name));
    }
  }
}

function writeBatchesFromAccepted(accepted: PageRow[]): void {
  fs.mkdirSync(API_PIPELINE_DIR, { recursive: true });
  clearApiPipelineBatchJson();
  if (accepted.length === 0) {
    return;
  }

  const batchCount = Math.ceil(accepted.length / PAGES_PER_BATCH_FILE);
  for (let fileIdx = 0; fileIdx < batchCount; fileIdx++) {
    const pages = accepted.slice(
      fileIdx * PAGES_PER_BATCH_FILE,
      (fileIdx + 1) * PAGES_PER_BATCH_FILE,
    );
    const num = String(fileIdx + 1).padStart(3, "0");
    const file = path.join(API_PIPELINE_DIR, `batch-${num}.json`);
    fs.writeFileSync(file, JSON.stringify({ pages }, null, 2), "utf-8");
    console.log(`Wrote ${pages.length} pages → ${path.relative(WEB_ROOT, file)}`);
  }
}

function getArg(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function run(cmd: string, cwd: string) {
  console.log(`\n🚀 Running: ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd, env: process.env });
}

function runInApi(cmd: string) {
  run(cmd, API_ROOT);
}

function getGeneratedOutputPath(batchFile: string): string {
  const base = path.basename(batchFile, ".json");
  return `content-batches/encyclopedia/generated-api-pipeline-${base}.json`;
}

function ensureResolvedTargetsJson(batchAbs: string): string | null {
  if (!fileExists(batchAbs)) {
    return null;
  }

  const raw = JSON.parse(fs.readFileSync(batchAbs, "utf8")) as
    | { pages?: Array<Record<string, unknown>>; targets?: Array<Record<string, unknown>> }
    | null;

  const resolvedAbs = batchAbs.replace(/\.json$/i, ".resolved-targets.json");

  if (fs.existsSync(resolvedAbs)) {
    return resolvedAbs;
  }

  if (!raw || typeof raw !== "object") {
    throw new Error(`Invalid batch JSON: ${batchAbs}`);
  }

  if (Array.isArray(raw.targets)) {
    fs.writeFileSync(
      resolvedAbs,
      JSON.stringify({ targets: raw.targets }, null, 2) + "\n",
      "utf8",
    );
    return resolvedAbs;
  }

  if (Array.isArray(raw.pages)) {
    const targets = raw.pages.map((page) => ({
      title: page.title,
      slug: page.slug,
      problem: page.problem,
      surface: page.surface,
      intent: page.intent,
      riskLevel: page.riskLevel,
      intents: [normalizeIntent(String(page.intent))],
    }));

    fs.writeFileSync(
      resolvedAbs,
      JSON.stringify({ targets }, null, 2) + "\n",
      "utf8",
    );
    return resolvedAbs;
  }

  throw new Error(`Batch file has neither pages nor targets: ${batchAbs}`);
}

function resolveSourceJsonForGenerate(batchAbs: string): string | null {
  const resolved = ensureResolvedTargetsJson(batchAbs);
  if (!resolved) {
    return null;
  }
  return resolved;
}

function getExistingBatchFiles(batchDir: string): string[] {
  if (!fileExists(batchDir)) {
    return [];
  }
  return fs
    .readdirSync(batchDir)
    .filter((name) => /^batch-\d+\.json$/i.test(name))
    .sort((a, b) => {
      const aNum = Number(a.match(/\d+/)?.[0] ?? 0);
      const bNum = Number(b.match(/\d+/)?.[0] ?? 0);
      return aNum - bNum;
    })
    .map((name) => path.join(batchDir, name));
}

function runPipelineOnDiskBatches(apiBase: string): void {
  const batchFiles = getExistingBatchFiles(API_PIPELINE_DIR);
  if (batchFiles.length === 0) {
    throw new Error("No batch-*.json files to process.");
  }

  for (const batchFile of batchFiles) {
    const sourceJson = resolveSourceJsonForGenerate(batchFile);
    if (!sourceJson) {
      console.warn(`[pipeline] skipping missing batch file: ${batchFile}`);
      continue;
    }

    const outputPath = getGeneratedOutputPath(batchFile);

    console.log("\n==============================");
    console.log(`Processing batch: ${path.relative(process.cwd(), batchFile)}`);
    console.log("==============================\n");

    console.log(`[pipeline] using source json: ${sourceJson}`);

    run(
      `npm run generate:encyclopedia-batch -- --source=${sourceJson} --output=${outputPath}`,
      WEB_ROOT,
    );

    run(
      `npm run intake:encyclopedia-generated-review-records -- --source=${outputPath} --api-base=${apiBase}`,
      WEB_ROOT,
    );

    runInApi(`npm run approve:all`);
    runInApi(`npm run promote:encyclopedia`);
  }

  console.log("\n✅ ALL BATCHES COMPLETE (this pass)\n");
}

async function main() {
  const args = process.argv.slice(2);
  const seedOnly = args.includes("--seed-only");
  const apiBase = `${normalizeApiOrigin(
    getArg("api-base") ||
      process.env.API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:3001",
  )}/api/v1`;

  if (!seedOnly && !fileExists(API_ROOT)) {
    throw new Error(`API package not found at ${API_ROOT}`);
  }

  if (seedOnly) {
    const corpusGaps = await buildCorpusGapFirstCandidates(apiBase);
    if (corpusGaps.length > 50_000) {
      throw new Error("Corpus gap explosion detected — aborting run");
    }
    if (corpusGaps.length === 0) {
      console.log("No corpus gaps. Skipping generation.");
      process.exit(0);
    }
    writeBatchesFromAccepted(corpusGaps);
    console.log("\n✅ Seed complete (--seed-only)\n");
    return;
  }

  console.log("\n—— Corpus-gap-only pass: loading live corpus keys ——\n");
  const corpusGaps = await buildCorpusGapFirstCandidates(apiBase);
  // Rows = (missing canonical pairs) × intents — can exceed matrix "cell" gap counts.
  if (corpusGaps.length > 50_000) {
    throw new Error("Corpus gap explosion detected — aborting run");
  }
  if (corpusGaps.length === 0) {
    console.log("No corpus gaps. Skipping generation.");
  } else {
    console.log(
      `Corpus-gap scan: ${corpusGaps.length} accepted (evidence OK, missing live canonical pair)`,
    );
    writeBatchesFromAccepted(corpusGaps);
    runPipelineOnDiskBatches(apiBase);
  }

  run(`npm run assert:coverage`, WEB_ROOT);
  console.log("\n✅ PIPELINE FINISHED (corpus-gap-only pass)\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
