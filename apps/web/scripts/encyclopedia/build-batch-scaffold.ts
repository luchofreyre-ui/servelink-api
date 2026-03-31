import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { encyclopediaIndexEntrySchema } from "../../src/lib/encyclopedia/schema";
import type { EncyclopediaIndexEntry } from "../../src/lib/encyclopedia/types";
import { resolveScaffoldIds } from "./lib/build-batch-scaffold-ids";
import { readJsonFile } from "./utils";

type Args = {
  ids: string[];
  /** Present when IDs came from `--ids-file` (for logging only). */
  idsFile?: string;
  status?: "draft" | "published";
  category?: "problems" | "methods" | "surfaces";
  cluster?: string;
  limit?: number;
  outputPath: string;
};

type BatchPage = {
  id: string;
  title: string;
  category: string;
  cluster: string;
  slug: string;
  summary: string;
  image: {
    primaryAlt: string;
    queries: string[];
  };
  sections: {
    what_this_is: string;
    why_it_happens: string;
    what_people_do_wrong: string;
    professional_method: string;
    data_and_benchmarks: string;
    professional_insights: string;
    when_to_call_a_professional: string;
    related_topics: string[];
  };
};

type BatchFile = {
  pages: BatchPage[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const masterIndexPath = path.join(
  repoRoot,
  "src",
  "content",
  "encyclopedia",
  "_index",
  "master-index.json",
);

function parseArgs(argv: string[]): Args {
  const resolved = resolveScaffoldIds(argv, repoRoot);
  const ids = resolved.source === "none" ? [] : [...resolved.ids];
  const idsFile = resolved.source === "file" ? resolved.idsFilePath : undefined;

  const statusArg = argv.find((arg) => arg.startsWith("--status="));
  const categoryArg = argv.find((arg) => arg.startsWith("--category="));
  const clusterArg = argv.find((arg) => arg.startsWith("--cluster="));
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const outputArg = argv.find((arg) => arg.startsWith("--output="));

  const status = statusArg
    ? (statusArg.slice("--status=".length) as "draft" | "published")
    : undefined;

  const category = categoryArg
    ? (categoryArg.slice("--category=".length) as "problems" | "methods" | "surfaces")
    : undefined;

  const cluster = clusterArg ? clusterArg.slice("--cluster=".length) : undefined;

  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : undefined;
  if (limitArg && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error(`Invalid --limit value: ${limitArg}`);
  }

  if (!outputArg) {
    throw new Error("Missing --output=content-batches/encyclopedia/your-batch.json");
  }

  return {
    ids,
    idsFile,
    status,
    category,
    cluster,
    limit,
    outputPath: path.resolve(repoRoot, outputArg.slice("--output=".length)),
  };
}

function readMasterIndex(): EncyclopediaIndexEntry[] {
  const raw = readJsonFile<unknown>(masterIndexPath);

  if (!Array.isArray(raw)) {
    throw new Error("master-index.json must be an array.");
  }

  return raw.map((entry) => encyclopediaIndexEntrySchema.parse(entry));
}

function buildSummary(entry: EncyclopediaIndexEntry): string {
  if (entry.category === "problems") {
    return `${entry.title} explained: what causes it, what makes it worse, and how professionals approach it without creating secondary damage or residue.`;
  }

  if (entry.category === "methods") {
    return `${entry.title} explained: when professionals use it, where it works best, and how to apply it with the right sequence and material awareness.`;
  }

  return `${entry.title} explained: how this surface behaves during cleaning, what commonly goes wrong, and how professionals clean it safely and effectively.`;
}

function buildPrimaryAlt(entry: EncyclopediaIndexEntry): string {
  return `${entry.title} surface or condition shown under cleaning inspection lighting`;
}

function buildImageQueries(entry: EncyclopediaIndexEntry): string[] {
  return [
    `${entry.slug.replace(/-/g, " ")} cleaning`,
    `${entry.title.toLowerCase()} professional cleaning`,
    `${entry.title.toLowerCase()} surface condition`,
  ];
}

function buildSection(entry: EncyclopediaIndexEntry, section: string): string {
  switch (section) {
    case "what_this_is":
      return `${entry.title} describes a real-world cleaning condition professionals identify by surface behavior, residue pattern, soil loading, and how the material reacts under normal maintenance.`;
    case "why_it_happens":
      return `The root causes usually involve a mix of soil type, surface condition, product choice, dwell time, moisture control, and repeated maintenance habits that compound over time.`;
    case "what_people_do_wrong":
      return `Most people make this worse by using the wrong chemistry, too much liquid, poor towel or pad rotation, aggressive scrubbing, or by treating the symptom without identifying the actual soil or surface issue first.`;
    case "professional_method":
      return `Professionals isolate the surface type, test small areas first, match chemistry and agitation to the material, control residue and rinse behavior, and verify the result under proper inspection light before scaling the process.`;
    case "data_and_benchmarks":
      return `Useful benchmarks include visual uniformity under side lighting, residue reduction after controlled passes, repeatability across similar surfaces, and whether the result holds after drying rather than only while wet.`;
    case "professional_insights":
      return `A strong professional read usually comes from pattern recognition: where the issue is concentrated, how it returns, what previous products were used, and whether the surface is signaling contamination, wear, or incompatibility.`;
    case "when_to_call_a_professional":
      return `Call a professional when the material is specialty-coated, natural stone, unknown, historically damaged, high-risk to over-wet, or when repeated DIY attempts have already layered in more residue or surface confusion.`;
    default:
      throw new Error(`Unknown section: ${section}`);
  }
}

function buildRelatedTopics(entry: EncyclopediaIndexEntry, allEntries: EncyclopediaIndexEntry[]): string[] {
  return allEntries
    .filter(
      (candidate) =>
        candidate.id !== entry.id &&
        (candidate.cluster === entry.cluster || candidate.category === entry.category),
    )
    .slice(0, 3)
    .map((candidate) => candidate.id);
}

function toBatchPage(entry: EncyclopediaIndexEntry, allEntries: EncyclopediaIndexEntry[]): BatchPage {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    cluster: entry.cluster,
    slug: entry.slug,
    summary: buildSummary(entry),
    image: {
      primaryAlt: buildPrimaryAlt(entry),
      queries: buildImageQueries(entry),
    },
    sections: {
      what_this_is: buildSection(entry, "what_this_is"),
      why_it_happens: buildSection(entry, "why_it_happens"),
      what_people_do_wrong: buildSection(entry, "what_people_do_wrong"),
      professional_method: buildSection(entry, "professional_method"),
      data_and_benchmarks: buildSection(entry, "data_and_benchmarks"),
      professional_insights: buildSection(entry, "professional_insights"),
      when_to_call_a_professional: buildSection(entry, "when_to_call_a_professional"),
      related_topics: buildRelatedTopics(entry, allEntries),
    },
  };
}

function writeJsonFile(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const allEntries = readMasterIndex();

  let selected = allEntries;

  if (args.ids.length > 0) {
    const idSet = new Set(args.ids);
    selected = selected.filter((entry) => idSet.has(entry.id));
  }

  if (args.status) {
    selected = selected.filter((entry) => entry.status === args.status);
  }

  if (args.category) {
    selected = selected.filter((entry) => entry.category === args.category);
  }

  if (args.cluster) {
    selected = selected.filter((entry) => entry.cluster === args.cluster);
  }

  if (typeof args.limit === "number") {
    selected = selected.slice(0, args.limit);
  }

  if (selected.length === 0) {
    throw new Error("No index entries matched the provided filters.");
  }

  const batch: BatchFile = {
    pages: selected.map((entry) => toBatchPage(entry, allEntries)),
  };

  writeJsonFile(args.outputPath, batch);

  console.log("Batch scaffold summary");
  console.log(
    JSON.stringify(
      {
        outputPath: path.relative(repoRoot, args.outputPath),
        pageCount: batch.pages.length,
        filters: {
          ids: args.idsFile ? null : args.ids,
          idsFile: args.idsFile ?? null,
          status: args.status ?? null,
          category: args.category ?? null,
          cluster: args.cluster ?? null,
          limit: args.limit ?? null,
        },
      },
      null,
      2,
    ),
  );

  console.log("\nPages:");
  for (const page of batch.pages) {
    console.log(`- ${page.id} | ${page.slug} | ${page.category} | ${page.cluster}`);
  }
}

main();
