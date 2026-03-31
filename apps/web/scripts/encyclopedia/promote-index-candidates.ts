import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { encyclopediaIndexEntrySchema } from "../../src/lib/encyclopedia/schema";
import type { EncyclopediaIndexEntry } from "../../src/lib/encyclopedia/types";
import { isEncyclopediaSearchIntentPromotableTitle } from "../../src/lib/encyclopedia/encyclopediaSearchIntentTitle";
import { buildIndexEntryFromReviewedCandidate } from "./lib/reviewed-candidate-to-master-entry";
import { readJsonFile } from "./utils";

type GeneratedType = "problem_surface" | "method_surface" | "problem_method";

type ReviewRecommendation = "promote" | "review" | "reject";

type GeneratedIndexCandidate = {
  id: string;
  slug: string;
  title: string;
  category: "problems" | "methods";
  cluster: string;
  role: "supporting";
  status: "draft";
  generatedType: GeneratedType;
  /** Present on human-reviewed batches (e.g. generated-reviewed-index-candidates.json). */
  recommendation?: ReviewRecommendation;
  /** Review queue manual triage; takes precedence over recommendation when set. */
  manualOverrideRecommendation?: ReviewRecommendation;
  scorerRecommendation?: ReviewRecommendation;
  normalizedTitle?: string;
  normalizedSlug?: string;
  normalizationWarnings?: string[];
  normalizationAction?: string;
};

type GeneratedIndexCandidatesFile = {
  generatedAt: string;
  total: number;
  candidates: GeneratedIndexCandidate[];
};

type Args = {
  dryRun: boolean;
  limit?: number;
  generatedType?: GeneratedType;
  recommendation?: ReviewRecommendation;
  inputPath: string;
  /** Only append rows whose title reads as Why/What/How search intent (excludes “X on Y” problem layer). */
  requireSearchIntentTitles: boolean;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const defaultInputPath = path.join(
  repoRoot,
  "content-batches",
  "encyclopedia",
  "generated-reviewed-index-candidates.json",
);

const masterIndexPath = path.join(
  repoRoot,
  "src",
  "content",
  "encyclopedia",
  "_index",
  "master-index.json",
);

function parseArgs(argv: string[]): Args {
  const dryRun = argv.includes("--dry-run");
  const requireSearchIntentTitles = argv.includes("--require-search-intent-titles");

  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const generatedTypeArg = argv.find((arg) => arg.startsWith("--generated-type="));
  const recommendationArg = argv.find((arg) => arg.startsWith("--recommendation="));
  const inputArg = argv.find((arg) => arg.startsWith("--input="));

  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : undefined;
  if (limitArg && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error(`Invalid --limit value: ${limitArg}`);
  }

  const generatedType = generatedTypeArg
    ? (generatedTypeArg.slice("--generated-type=".length) as GeneratedType)
    : undefined;

  if (
    generatedType &&
    generatedType !== "problem_surface" &&
    generatedType !== "method_surface" &&
    generatedType !== "problem_method"
  ) {
    throw new Error(`Invalid --generated-type value: ${generatedType}`);
  }

  const recommendation = recommendationArg
    ? (recommendationArg.slice("--recommendation=".length) as ReviewRecommendation)
    : undefined;

  if (
    recommendation &&
    recommendation !== "promote" &&
    recommendation !== "review" &&
    recommendation !== "reject"
  ) {
    throw new Error(`Invalid --recommendation value: ${recommendation}`);
  }

  const inputPath = inputArg
    ? path.resolve(repoRoot, inputArg.slice("--input=".length))
    : defaultInputPath;

  return {
    dryRun,
    limit,
    generatedType,
    recommendation,
    inputPath,
    requireSearchIntentTitles,
  };
}

function candidateTitleForIntentGate(candidate: GeneratedIndexCandidate): string {
  const n = candidate.normalizedTitle?.trim();
  if (n) {
    return n;
  }
  return candidate.title;
}

function effectiveRecommendation(candidate: GeneratedIndexCandidate): ReviewRecommendation {
  const o = candidate.manualOverrideRecommendation;
  if (o === "promote" || o === "review" || o === "reject") {
    return o;
  }
  return candidate.recommendation ?? "review";
}

/** Same pre-check as the append loop: would this candidate be skipped as already in master? */
function candidateAlreadyInMaster(
  candidate: GeneratedIndexCandidate,
  existingIds: Set<string>,
  existingSlugs: Set<string>,
): boolean {
  if (existingIds.has(candidate.id)) {
    return true;
  }
  const slug = candidate.normalizedSlug ?? candidate.slug;
  return existingSlugs.has(slug);
}

function writeJsonFile(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function readGeneratedCandidates(filePath: string): GeneratedIndexCandidatesFile {
  const raw = readJsonFile<unknown>(filePath);

  if (!raw || typeof raw !== "object") {
    throw new Error("Generated candidates file must be an object.");
  }

  const obj = raw as Partial<GeneratedIndexCandidatesFile> & {
    summary?: { total?: number };
  };

  if (!Array.isArray(obj.candidates)) {
    throw new Error("Generated candidates file must contain candidates array.");
  }

  const totalFromFile = Number(
    obj.total ?? obj.summary?.total ?? obj.candidates.length,
  );

  return {
    generatedAt: String(obj.generatedAt ?? ""),
    total: totalFromFile,
    candidates: obj.candidates.map((candidate) => {
      if (!candidate || typeof candidate !== "object") {
        throw new Error("Invalid candidate entry.");
      }

      const c = candidate as GeneratedIndexCandidate & { recommendation?: string };

      if (
        !c.id ||
        !c.slug ||
        !c.title ||
        !c.category ||
        !c.cluster ||
        !c.role ||
        !c.status ||
        !c.generatedType
      ) {
        throw new Error(`Candidate missing required fields: ${JSON.stringify(candidate)}`);
      }

      if (c.role !== "supporting") {
        throw new Error(`Generated candidate must have role=supporting: ${c.id}`);
      }

      if (c.status !== "draft") {
        throw new Error(`Generated candidate must have status=draft: ${c.id}`);
      }

      let recommendation: ReviewRecommendation | undefined;
      if (c.recommendation !== undefined) {
        if (
          c.recommendation !== "promote" &&
          c.recommendation !== "review" &&
          c.recommendation !== "reject"
        ) {
          throw new Error(
            `Invalid recommendation for candidate ${c.id}: ${String(c.recommendation)}`,
          );
        }
        recommendation = c.recommendation;
      }

      const ext = c as GeneratedIndexCandidate & {
        normalizedTitle?: string;
        normalizedSlug?: string;
        normalizationWarnings?: string[];
        normalizationAction?: string;
        scorerRecommendation?: string;
        manualOverrideRecommendation?: string;
      };

      let manualOverrideRecommendation: ReviewRecommendation | undefined;
      if (ext.manualOverrideRecommendation !== undefined) {
        if (
          ext.manualOverrideRecommendation !== "promote" &&
          ext.manualOverrideRecommendation !== "review" &&
          ext.manualOverrideRecommendation !== "reject"
        ) {
          throw new Error(
            `Invalid manualOverrideRecommendation for candidate ${c.id}: ${String(ext.manualOverrideRecommendation)}`,
          );
        }
        manualOverrideRecommendation = ext.manualOverrideRecommendation as ReviewRecommendation;
      }

      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        category: c.category,
        cluster: c.cluster,
        role: c.role,
        status: c.status,
        generatedType: c.generatedType,
        ...(recommendation !== undefined ? { recommendation } : {}),
        ...(manualOverrideRecommendation !== undefined
          ? { manualOverrideRecommendation }
          : {}),
        ...(ext.scorerRecommendation !== undefined
          ? { scorerRecommendation: ext.scorerRecommendation as ReviewRecommendation }
          : {}),
        ...(ext.normalizedTitle !== undefined ? { normalizedTitle: ext.normalizedTitle } : {}),
        ...(ext.normalizedSlug !== undefined ? { normalizedSlug: ext.normalizedSlug } : {}),
        ...(ext.normalizationWarnings !== undefined
          ? { normalizationWarnings: ext.normalizationWarnings }
          : {}),
        ...(ext.normalizationAction !== undefined
          ? { normalizationAction: ext.normalizationAction }
          : {}),
      };
    }),
  };
}

function readMasterIndex(): EncyclopediaIndexEntry[] {
  const raw = readJsonFile<unknown>(masterIndexPath);

  if (!Array.isArray(raw)) {
    throw new Error("master-index.json must be an array.");
  }

  return raw.map((entry) => encyclopediaIndexEntrySchema.parse(entry));
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const generatedFile = readGeneratedCandidates(args.inputPath);
  const masterIndex = readMasterIndex();

  const existingIds = new Set(masterIndex.map((entry) => entry.id));
  const existingSlugs = new Set(masterIndex.map((entry) => entry.slug));

  let candidates = generatedFile.candidates;

  if (args.recommendation) {
    candidates = candidates.filter(
      (candidate) => effectiveRecommendation(candidate) === args.recommendation,
    );
  }

  if (args.generatedType) {
    candidates = candidates.filter((candidate) => candidate.generatedType === args.generatedType);
  }

  if (args.requireSearchIntentTitles) {
    candidates = candidates.filter((candidate) =>
      isEncyclopediaSearchIntentPromotableTitle(candidateTitleForIntentGate(candidate)),
    );
  }

  if (typeof args.limit === "number") {
    /**
     * With --limit, prefer candidates not yet in master so the cap applies to *new* rows.
     * Otherwise the first N promote rows are often already indexed → appendedCount stays 0.
     */
    candidates = [...candidates].sort((a, b) => {
      const skipA = candidateAlreadyInMaster(a, existingIds, existingSlugs);
      const skipB = candidateAlreadyInMaster(b, existingIds, existingSlugs);
      if (skipA !== skipB) {
        return skipA ? 1 : -1;
      }
      return a.slug.localeCompare(b.slug);
    });
    candidates = candidates.slice(0, args.limit);
  }

  const appended: EncyclopediaIndexEntry[] = [];
  const skipped: Array<{ id: string; slug: string; reason: string }> = [];
  let usedRawFallbackCount = 0;

  for (const candidate of candidates) {
    if (existingIds.has(candidate.id)) {
      skipped.push({
        id: candidate.id,
        slug: candidate.slug,
        reason: "id already exists in master-index.json",
      });
      continue;
    }

    const { entry: parsed, usedRawTitleSlugFallback } = buildIndexEntryFromReviewedCandidate(
      candidate,
    );
    if (usedRawTitleSlugFallback) {
      usedRawFallbackCount += 1;
    }

    if (existingSlugs.has(parsed.slug)) {
      skipped.push({
        id: candidate.id,
        slug: parsed.slug,
        reason: "slug already exists in master-index.json",
      });
      continue;
    }

    appended.push(parsed);
    existingIds.add(parsed.id);
    existingSlugs.add(parsed.slug);
  }

  const nextIndex = [...masterIndex, ...appended];

  console.log("Index promotion summary");
  console.log(
    JSON.stringify(
      {
        inputPath: path.relative(repoRoot, args.inputPath),
        dryRun: args.dryRun,
        filters: {
          recommendation: args.recommendation ?? null,
          generatedType: args.generatedType ?? null,
          limit: args.limit ?? null,
          requireSearchIntentTitles: args.requireSearchIntentTitles,
        },
        sourceCandidateCount: generatedFile.candidates.length,
        consideredCount: candidates.length,
        appendedCount: appended.length,
        skippedCount: skipped.length,
        usedRawFallbackCount: usedRawFallbackCount,
      },
      null,
      2,
    ),
  );

  if (appended.length > 0) {
    console.log("\nAppended entries:");
    for (const entry of appended) {
      console.log(`- ${entry.id} | ${entry.slug} | ${entry.title} | ${entry.category} | ${entry.cluster}`);
    }
  }

  if (skipped.length > 0) {
    console.log("\nSkipped entries:");
    for (const entry of skipped.slice(0, 20)) {
      console.log(`- ${entry.id} | ${entry.slug} | ${entry.reason}`);
    }
    if (skipped.length > 20) {
      console.log(`...and ${skipped.length - 20} more skipped entries`);
    }
  }

  if (args.dryRun) {
    console.log("\nDry run only. master-index.json was not modified.");
    return;
  }

  writeJsonFile(masterIndexPath, nextIndex);
  console.log(`\nUpdated master index: ${path.relative(repoRoot, masterIndexPath)}`);
}

main();
