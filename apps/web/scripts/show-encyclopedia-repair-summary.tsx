import fs from "fs";
import path from "path";

function readRecords(fileName: string): unknown[] {
  const filePath = path.join(
    process.cwd(),
    "content-batches/encyclopedia",
    fileName
  );

  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as { records?: unknown[] };

  return Array.isArray(parsed.records) ? parsed.records : [];
}

const notes = readRecords("editorial-notes.json");
const rewrites = readRecords("rewrite-queue.json");
const history = readRecords("repair-history.json");
const completion = readRecords("repair-completion.json");
const rewriteDrafts = readRecords("rewrite-drafts.json");
const rewriteApplications = readRecords("rewrite-applications.json");

console.log({
  editorialNotesCount: notes.length,
  rewriteQueueCount: rewrites.length,
  repairHistoryCount: history.length,
  repairCompletionCount: completion.length,
  rewriteDraftCount: rewriteDrafts.length,
  rewriteApplicationCount: rewriteApplications.length,
});
