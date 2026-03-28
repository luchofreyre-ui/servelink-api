import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  encyclopediaIndexEntrySchema,
  encyclopediaIndexStatusSchema,
} from "../../src/lib/encyclopedia/schema";
import type {
  EncyclopediaIndexEntry,
  EncyclopediaIndexStatus,
} from "../../src/lib/encyclopedia/types";
import { readJsonFile, writeTextFile } from "./utils";

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

function main(): void {
  const idArg = process.argv[2];
  const statusArg = process.argv[3];

  if (!idArg || !statusArg) {
    throw new Error(
      "Usage: tsx scripts/encyclopedia/promote-index-status.ts <ENTRY_ID|all> <planned|draft|published|archived>",
    );
  }

  const targetStatus = encyclopediaIndexStatusSchema.parse(
    statusArg,
  ) as EncyclopediaIndexStatus;

  const raw = readJsonFile<unknown>(indexPath);

  if (!Array.isArray(raw)) {
    throw new Error("master-index.json must be an array.");
  }

  const indexEntries = raw.map((entry) =>
    encyclopediaIndexEntrySchema.parse(entry),
  ) as EncyclopediaIndexEntry[];

  let updatedCount = 0;

  const nextEntries = indexEntries.map((entry) => {
    const shouldUpdate = idArg === "all" || entry.id === idArg;

    if (!shouldUpdate) {
      return entry;
    }

    updatedCount += 1;

    return {
      ...entry,
      status: targetStatus,
    };
  });

  if (updatedCount === 0) {
    throw new Error(`No index entry matched "${idArg}"`);
  }

  writeTextFile(indexPath, `${JSON.stringify(nextEntries, null, 2)}\n`);
  console.log(
    `Updated ${updatedCount} encyclopedia index entr${
      updatedCount === 1 ? "y" : "ies"
    } to status "${targetStatus}".`,
  );
}

main();
