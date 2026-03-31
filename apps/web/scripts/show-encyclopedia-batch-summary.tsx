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

console.log({
  notes: readRecords("editorial-notes.json").length,
  attachedEvidence: readRecords("attached-evidence.json").length,
  repairCompletion: readRecords("repair-completion.json").length,
});
