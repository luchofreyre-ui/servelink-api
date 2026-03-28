import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  encyclopediaFrontmatterSchema,
  encyclopediaIndexEntrySchema,
} from "../../src/lib/encyclopedia/schema";
import type {
  EncyclopediaFrontmatter,
  EncyclopediaIndexEntry,
} from "../../src/lib/encyclopedia/types";
import {
  parseSimpleFrontmatter,
  readJsonFile,
  walkFiles,
} from "./utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const contentRoot = path.join(repoRoot, "src", "content", "encyclopedia");
const indexPath = path.join(contentRoot, "_index", "master-index.json");

function parseFrontmatter(filePath: string): EncyclopediaFrontmatter {
  const raw = fs.readFileSync(filePath, "utf8");
  const { record } = parseSimpleFrontmatter(raw);

  return encyclopediaFrontmatterSchema.parse({
    id: String(record.id ?? ""),
    title: String(record.title ?? ""),
    category: String(record.category ?? ""),
    cluster: String(record.cluster ?? ""),
    role: String(record.role ?? ""),
    slug: String(record.slug ?? ""),
    summary: String(record.summary ?? ""),
    status: String(record.status ?? ""),
    primaryImageAlt: String(record.primaryImageAlt ?? ""),
    imageQueries: Array.isArray(record.imageQueries) ? record.imageQueries : [],
    relatedTopics: Array.isArray(record.relatedTopics) ? record.relatedTopics : [],
  });
}

function buildExpectedMarkdownPath(entry: EncyclopediaIndexEntry): string {
  return path.join(contentRoot, entry.category, entry.cluster, `${entry.slug}.md`);
}

function main(): void {
  const raw = readJsonFile<unknown>(indexPath);

  if (!Array.isArray(raw)) {
    throw new Error("master-index.json must be an array");
  }

  const parsed = raw.map((entry) => encyclopediaIndexEntrySchema.parse(entry));
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const entry of parsed) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate id: ${entry.id}`);
    }

    if (slugs.has(`${entry.category}/${entry.slug}`)) {
      throw new Error(`Duplicate category/slug: ${entry.category}/${entry.slug}`);
    }

    ids.add(entry.id);
    slugs.add(`${entry.category}/${entry.slug}`);
  }

  const indexById = new Map(parsed.map((entry) => [entry.id, entry]));
  const markdownFiles = walkFiles(contentRoot, ".md").filter(
    (filePath) => !filePath.includes(`${path.sep}_index${path.sep}`),
  );

  for (const filePath of markdownFiles) {
    const frontmatter = parseFrontmatter(filePath);
    const indexEntry = indexById.get(frontmatter.id);

    if (!indexEntry) {
      throw new Error(
        `Markdown file ${filePath} references id ${frontmatter.id} which is missing from master-index.json`,
      );
    }

    const mismatches: string[] = [];

    if (frontmatter.title !== indexEntry.title) {
      mismatches.push(`title md="${frontmatter.title}" index="${indexEntry.title}"`);
    }

    if (frontmatter.category !== indexEntry.category) {
      mismatches.push(
        `category md="${frontmatter.category}" index="${indexEntry.category}"`,
      );
    }

    if (frontmatter.cluster !== indexEntry.cluster) {
      mismatches.push(
        `cluster md="${frontmatter.cluster}" index="${indexEntry.cluster}"`,
      );
    }

    if (frontmatter.role !== indexEntry.role) {
      mismatches.push(`role md="${frontmatter.role}" index="${indexEntry.role}"`);
    }

    if (frontmatter.slug !== indexEntry.slug) {
      mismatches.push(`slug md="${frontmatter.slug}" index="${indexEntry.slug}"`);
    }

    if (frontmatter.status !== indexEntry.status) {
      mismatches.push(
        `status md="${frontmatter.status}" index="${indexEntry.status}"`,
      );
    }

    const expectedPath = buildExpectedMarkdownPath(indexEntry);

    if (path.resolve(filePath) !== path.resolve(expectedPath)) {
      mismatches.push(`path md="${filePath}" expected="${expectedPath}"`);
    }

    if (mismatches.length > 0) {
      throw new Error(
        `Frontmatter mismatch for ${frontmatter.id}: ${mismatches.join("; ")}`,
      );
    }
  }

  for (const entry of parsed) {
    const expectedPath = buildExpectedMarkdownPath(entry);
    const fileExists = fs.existsSync(expectedPath);

    if (entry.status === "published" && !fileExists) {
      throw new Error(
        `Published index entry ${entry.id} is missing markdown file: ${expectedPath}`,
      );
    }
  }

  console.log(
    `Validated ${parsed.length} encyclopedia index entries and ${markdownFiles.length} markdown files.`,
  );
}

main();
