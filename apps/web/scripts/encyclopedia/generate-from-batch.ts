import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  encyclopediaBatchFileSchema,
  encyclopediaIndexEntrySchema,
} from "../../src/lib/encyclopedia/schema";
import type {
  EncyclopediaBatchPage,
  EncyclopediaIndexEntry,
} from "../../src/lib/encyclopedia/types";
import {
  normalizeParagraphBlock,
  readJsonFile,
  writeTextFile,
  yamlList,
} from "./utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const indexPath = path.join(
  repoRoot,
  "src",
  "content",
  "encyclopedia",
  "_index",
  "master-index.json",
);

function getIndexEntries(): EncyclopediaIndexEntry[] {
  const raw = readJsonFile<unknown>(indexPath);

  if (!Array.isArray(raw)) {
    throw new Error("master-index.json must be an array.");
  }

  return raw.map((entry) => encyclopediaIndexEntrySchema.parse(entry));
}

function getIndexEntryById(
  indexEntries: EncyclopediaIndexEntry[],
  id: string,
): EncyclopediaIndexEntry {
  const entry = indexEntries.find((item) => item.id === id);

  if (!entry) {
    throw new Error(`Batch page ${id} does not exist in master-index.json`);
  }

  return entry;
}

function assertBatchPageMatchesIndex(
  page: EncyclopediaBatchPage,
  indexEntry: EncyclopediaIndexEntry,
): void {
  const mismatches: string[] = [];

  if (page.title !== indexEntry.title) {
    mismatches.push(`title batch="${page.title}" index="${indexEntry.title}"`);
  }

  if (page.category !== indexEntry.category) {
    mismatches.push(
      `category batch="${page.category}" index="${indexEntry.category}"`,
    );
  }

  if (page.cluster !== indexEntry.cluster) {
    mismatches.push(
      `cluster batch="${page.cluster}" index="${indexEntry.cluster}"`,
    );
  }

  if (page.slug !== indexEntry.slug) {
    mismatches.push(`slug batch="${page.slug}" index="${indexEntry.slug}"`);
  }

  if (mismatches.length > 0) {
    throw new Error(
      `Batch page ${page.id} does not match master-index.json: ${mismatches.join(
        "; ",
      )}`,
    );
  }
}

function buildMarkdown(
  page: EncyclopediaBatchPage,
  indexEntry: EncyclopediaIndexEntry,
): string {
  const frontmatter = [
    "---",
    `id: ${indexEntry.id}`,
    `title: ${indexEntry.title}`,
    `category: ${indexEntry.category}`,
    `cluster: ${indexEntry.cluster}`,
    `role: ${indexEntry.role}`,
    `slug: ${indexEntry.slug}`,
    `summary: ${page.summary}`,
    `status: ${indexEntry.status}`,
    `primaryImageAlt: ${page.image.primaryAlt}`,
    "imageQueries:",
    yamlList(page.image.queries),
    "relatedTopics:",
    yamlList(page.sections.related_topics),
    "---",
    "",
  ].join("\n");

  const body = [
    "## What This Is",
    "",
    normalizeParagraphBlock(page.sections.what_this_is),
    "",
    "## Why It Happens",
    "",
    normalizeParagraphBlock(page.sections.why_it_happens),
    "",
    "## What People Do Wrong",
    "",
    normalizeParagraphBlock(page.sections.what_people_do_wrong),
    "",
    "## Professional Method",
    "",
    normalizeParagraphBlock(page.sections.professional_method),
    "",
    "## Data and Benchmarks",
    "",
    normalizeParagraphBlock(page.sections.data_and_benchmarks),
    "",
    "## Professional Insights",
    "",
    normalizeParagraphBlock(page.sections.professional_insights),
    "",
    "## When to Call a Professional",
    "",
    normalizeParagraphBlock(page.sections.when_to_call_a_professional),
    "",
  ].join("\n");

  return `${frontmatter}${body}`;
}

function main(): void {
  const batchArg = process.argv[2];

  if (!batchArg) {
    throw new Error(
      "Missing batch path. Usage: tsx scripts/encyclopedia/generate-from-batch.ts content-batches/encyclopedia/batch-001.json",
    );
  }

  const batchPath = path.resolve(repoRoot, batchArg);
  const raw = readJsonFile<unknown>(batchPath);
  const batch = encyclopediaBatchFileSchema.parse(raw);
  const indexEntries = getIndexEntries();

  for (const page of batch.pages) {
    const indexEntry = getIndexEntryById(indexEntries, page.id);
    assertBatchPageMatchesIndex(page, indexEntry);

    const outputPath = path.join(
      repoRoot,
      "src",
      "content",
      "encyclopedia",
      indexEntry.category,
      indexEntry.cluster,
      `${indexEntry.slug}.md`,
    );

    writeTextFile(outputPath, buildMarkdown(page, indexEntry));
    console.log(`Generated: ${outputPath}`);
  }
}

main();
