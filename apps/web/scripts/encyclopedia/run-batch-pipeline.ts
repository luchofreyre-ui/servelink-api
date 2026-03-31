import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const MASTER_INDEX = path.join(
  repoRoot,
  "src",
  "content",
  "encyclopedia",
  "_index",
  "master-index.json",
);

const REPORTS_DIR = path.join(repoRoot, "content-batches", "encyclopedia", "reports");

type PipelineMode = "gap" | "expanded";

type CliArgs = {
  mode: PipelineMode;
  batchName: string;
  clusters?: string[];
  promoteLimit: number;
};

type ReviewedFileSummary = {
  total: number;
  promote: number;
  review: number;
  reject: number;
};

type PipelineSummary = {
  batchName: string;
  mode: PipelineMode;
  startedAt: string;
  finishedAt: string;
  inputFiles: {
    rawCandidates: string;
    reviewedCandidates: string;
    /** Relative to repo root; written after a successful promote step. */
    appendedIds?: string;
  };
  reviewedSummary: ReviewedFileSummary | null;
  promoteSummary: {
    appendedCount: number;
    skippedCount: number;
    consideredCount: number;
    sourceCandidateCount?: number;
  } | null;
  appendedIds: string[];
  scaffold: { outputPath: string; pageCount: number } | null;
  enriched: { outputPath: string; pageCount: number } | null;
  generatedFileCount: number;
  build: { ok: boolean; exitCode: number | null };
  steps: string[];
  error?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const modeArg = argv.find((a) => a.startsWith("--mode="));
  const batchArg = argv.find((a) => a.startsWith("--batch-name="));
  const clustersArg = argv.find((a) => a.startsWith("--clusters="));
  const limitArg = argv.find((a) => a.startsWith("--promote-limit="));

  if (!modeArg) {
    throw new Error('Missing --mode=gap or --mode=expanded');
  }
  const mode = modeArg.slice("--mode=".length).trim() as PipelineMode;
  if (mode !== "gap" && mode !== "expanded") {
    throw new Error(`Invalid --mode: ${mode}`);
  }

  if (!batchArg) {
    throw new Error("Missing --batch-name=batch-013 (or similar)");
  }
  const batchName = batchArg.slice("--batch-name=".length).trim();
  if (!batchName) {
    throw new Error("Empty --batch-name");
  }

  const clusters = clustersArg
    ? clustersArg
        .slice("--clusters=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  let promoteLimit = 500;
  if (limitArg) {
    const n = Number(limitArg.slice("--promote-limit=".length).trim());
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error(`Invalid --promote-limit: ${limitArg}`);
    }
    promoteLimit = n;
  }

  return { mode, batchName, clusters, promoteLimit };
}

function runStep(
  label: string,
  command: string,
  args: string[],
  summary: PipelineSummary,
): { ok: boolean; stdout: string; stderr: string } {
  summary.steps.push(label);
  const r = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
  });
  const stdout = r.stdout ?? "";
  const stderr = r.stderr ?? "";
  if (r.error) {
    summary.error = `${label}: ${r.error.message}`;
  }
  return { ok: r.status === 0, stdout, stderr };
}

function readMasterIds(): string[] {
  const raw = fs.readFileSync(MASTER_INDEX, "utf8");
  const arr = JSON.parse(raw) as { id: string }[];
  if (!Array.isArray(arr)) {
    throw new Error("master-index.json must be an array");
  }
  return arr.map((e) => e.id);
}

function readReviewedSummary(reviewedPath: string): ReviewedFileSummary | null {
  if (!fs.existsSync(reviewedPath)) {
    return null;
  }
  const raw = JSON.parse(fs.readFileSync(reviewedPath, "utf8")) as {
    summary?: ReviewedFileSummary;
  };
  return raw.summary ?? null;
}

function parsePromoteStdout(stdout: string): Partial<PipelineSummary["promoteSummary"]> {
  const pick = (key: string): number | undefined => {
    const m = stdout.match(new RegExp(`"${key}":\\s*(\\d+)`));
    return m ? Number(m[1]) : undefined;
  };
  return {
    appendedCount: pick("appendedCount"),
    skippedCount: pick("skippedCount"),
    consideredCount: pick("consideredCount"),
    sourceCandidateCount: pick("sourceCandidateCount"),
  };
}

function writeSummary(summary: PipelineSummary, reportPath: string): void {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`\nPipeline report: ${path.relative(repoRoot, reportPath)}`);
}

function main(): void {
  const startedAt = new Date().toISOString();
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
    return;
  }

  const { mode, batchName, clusters, promoteLimit } = args;

  const runDirRel = path.posix.join("content-batches", "encyclopedia", "pipeline-runs", batchName);
  const rawRel =
    mode === "gap" ? path.posix.join(runDirRel, "gap-raw.json") : path.posix.join(runDirRel, "expanded-raw.json");
  const reviewedRel =
    mode === "gap"
      ? path.posix.join(runDirRel, "gap-reviewed.json")
      : path.posix.join(runDirRel, "expanded-reviewed.json");

  const rawPath = path.join(repoRoot, rawRel);
  const reviewedPath = path.join(repoRoot, reviewedRel);
  const appendedIdsRel = path.posix.join(runDirRel, "appended-ids.json");
  const appendedIdsPath = path.join(repoRoot, appendedIdsRel);
  const scaffoldPath = path.join(repoRoot, "content-batches", "encyclopedia", `${batchName}.json`);
  const enrichedPath = path.join(repoRoot, "content-batches", "encyclopedia", `${batchName}.enriched.json`);
  const reportPath = path.join(REPORTS_DIR, `${batchName}.pipeline-summary.json`);

  const summary: PipelineSummary = {
    batchName,
    mode,
    startedAt,
    finishedAt: startedAt,
    inputFiles: {
      rawCandidates: rawRel,
      reviewedCandidates: reviewedRel,
    },
    reviewedSummary: null,
    promoteSummary: null,
    appendedIds: [],
    scaffold: null,
    enriched: null,
    generatedFileCount: 0,
    build: { ok: false, exitCode: null },
    steps: [],
  };

  const npx = process.platform === "win32" ? "npx.cmd" : "npx";

  if (mode === "gap") {
    const gapArgs = ["tsx", "scripts/encyclopedia/generate-gap-backfill-candidates.ts", `--output=${rawRel}`];
    if (clusters?.length) {
      gapArgs.push(`--clusters=${clusters.join(",")}`);
    }
    const g = runStep("generate-gap-backfill-candidates", npx, gapArgs, summary);
    if (!g.ok) {
      console.error(g.stdout);
      console.error(g.stderr);
      summary.error = summary.error ?? "Gap generation failed";
      summary.finishedAt = new Date().toISOString();
      writeSummary(summary, reportPath);
      process.exit(1);
      return;
    }
  } else {
    const ex = runStep(
      "generate-expanded-index-candidates",
      npx,
      ["tsx", "scripts/encyclopedia/generate-expanded-index-candidates.ts", `--output=${rawRel}`],
      summary,
    );
    if (!ex.ok) {
      console.error(ex.stdout);
      console.error(ex.stderr);
      summary.error = summary.error ?? "Expanded generation failed";
      summary.finishedAt = new Date().toISOString();
      writeSummary(summary, reportPath);
      process.exit(1);
      return;
    }
  }

  const exp = runStep(
    "expand-reviewed-index-candidates",
    npx,
    [
      "tsx",
      "scripts/encyclopedia/expand-and-review-index-candidates.ts",
      `--input=${rawRel}`,
      `--output=${reviewedRel}`,
    ],
    summary,
  );
  if (!exp.ok) {
    console.error(exp.stdout);
    console.error(exp.stderr);
    summary.error = summary.error ?? "Expand → reviewed failed";
    summary.finishedAt = new Date().toISOString();
    writeSummary(summary, reportPath);
    process.exit(1);
    return;
  }

  summary.reviewedSummary = readReviewedSummary(reviewedPath);

  const idsBefore = readMasterIds();
  const lenBefore = idsBefore.length;

  const prom = runStep(
    "promote-index-candidates",
    npx,
    [
      "tsx",
      "scripts/encyclopedia/promote-index-candidates.ts",
      `--input=${reviewedRel}`,
      "--recommendation=promote",
      `--limit=${promoteLimit}`,
    ],
    summary,
  );
  console.log(prom.stdout);
  if (prom.stderr) {
    console.error(prom.stderr);
  }

  const parsed = parsePromoteStdout(prom.stdout);
  const idsAfter = readMasterIds();
  summary.appendedIds = idsAfter.slice(lenBefore);

  summary.promoteSummary = {
    appendedCount: parsed.appendedCount ?? summary.appendedIds.length,
    skippedCount: parsed.skippedCount ?? 0,
    consideredCount: parsed.consideredCount ?? 0,
    sourceCandidateCount: parsed.sourceCandidateCount,
  };

  if (!prom.ok) {
    summary.error = summary.error ?? "Promote failed";
    summary.finishedAt = new Date().toISOString();
    writeSummary(summary, reportPath);
    process.exit(1);
    return;
  }

  fs.mkdirSync(path.dirname(appendedIdsPath), { recursive: true });
  fs.writeFileSync(appendedIdsPath, `${JSON.stringify(summary.appendedIds, null, 2)}\n`, "utf8");
  summary.inputFiles = {
    ...summary.inputFiles,
    appendedIds: appendedIdsRel,
  };

  if (summary.appendedIds.length === 0) {
    console.log("\nZero rows appended — skipping scaffold, enrich, generate.");
    const b = runStep("npm run build", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], summary);
    summary.build = { ok: b.ok, exitCode: b.ok ? 0 : 1 };
    if (!b.ok) {
      console.error(b.stdout);
      console.error(b.stderr);
    }
    summary.finishedAt = new Date().toISOString();
    writeSummary(summary, reportPath);
    process.exit(b.ok ? 0 : 1);
    return;
  }

  const sc = runStep(
    "build-batch-scaffold",
    npx,
    [
      "tsx",
      "scripts/encyclopedia/build-batch-scaffold.ts",
      `--ids-file=${appendedIdsRel}`,
      `--output=content-batches/encyclopedia/${batchName}.json`,
    ],
    summary,
  );
  console.log(sc.stdout);
  if (!sc.ok) {
    console.error(sc.stderr);
    summary.error = summary.error ?? "Scaffold failed";
    summary.finishedAt = new Date().toISOString();
    writeSummary(summary, reportPath);
    process.exit(1);
    return;
  }

  try {
    const batchRaw = JSON.parse(fs.readFileSync(scaffoldPath, "utf8")) as { pages?: unknown[] };
    summary.scaffold = {
      outputPath: path.relative(repoRoot, scaffoldPath),
      pageCount: Array.isArray(batchRaw.pages) ? batchRaw.pages.length : 0,
    };
  } catch {
    summary.scaffold = {
      outputPath: path.relative(repoRoot, scaffoldPath),
      pageCount: summary.appendedIds.length,
    };
  }

  const en = runStep(
    "enrich-batch-copy",
    npx,
    [
      "tsx",
      "scripts/encyclopedia/enrich-batch-copy.ts",
      `--input=content-batches/encyclopedia/${batchName}.json`,
      `--output=content-batches/encyclopedia/${batchName}.enriched.json`,
    ],
    summary,
  );
  console.log(en.stdout);
  if (!en.ok) {
    console.error(en.stderr);
    summary.error = summary.error ?? "Enrich failed";
    summary.finishedAt = new Date().toISOString();
    writeSummary(summary, reportPath);
    process.exit(1);
    return;
  }

  try {
    const enrichedRaw = JSON.parse(fs.readFileSync(enrichedPath, "utf8")) as { pages?: unknown[] };
    summary.enriched = {
      outputPath: path.relative(repoRoot, enrichedPath),
      pageCount: Array.isArray(enrichedRaw.pages) ? enrichedRaw.pages.length : 0,
    };
  } catch {
    summary.enriched = {
      outputPath: path.relative(repoRoot, enrichedPath),
      pageCount: summary.appendedIds.length,
    };
  }

  const gen = runStep(
    "generate-from-batch",
    npx,
    ["tsx", "scripts/encyclopedia/generate-from-batch.ts", `content-batches/encyclopedia/${batchName}.enriched.json`],
    summary,
  );
  console.log(gen.stdout);
  if (!gen.ok) {
    console.error(gen.stderr);
    summary.error = summary.error ?? "Generate failed";
    summary.finishedAt = new Date().toISOString();
    writeSummary(summary, reportPath);
    process.exit(1);
    return;
  }

  const genLines = gen.stdout.split("\n").filter((l) => l.startsWith("Generated:"));
  summary.generatedFileCount = genLines.length;

  const b = runStep("npm run build", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], summary);
  summary.build = { ok: b.ok, exitCode: b.ok ? 0 : 1 };
  if (!b.ok) {
    console.error(b.stdout);
    console.error(b.stderr);
  }

  summary.finishedAt = new Date().toISOString();
  writeSummary(summary, reportPath);
  process.exit(b.ok ? 0 : 1);
}

main();
