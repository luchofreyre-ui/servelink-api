import fs from "fs";
import path from "path";

const filePath = path.join(
  process.cwd(),
  "content-batches/encyclopedia/rewrite-applications.json"
);

const raw = fs.readFileSync(filePath, "utf-8");
const parsed = JSON.parse(raw) as { records?: unknown[] };

console.log(Array.isArray(parsed.records) ? parsed.records : []);
