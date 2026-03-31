import fs from "node:fs";
import path from "node:path";
import type { RewriteSectionKey } from "./rewriteQueueTypes";
import type {
  RewriteApplicationRecord,
  RewriteApplicationStore,
} from "./rewriteApplicationTypes";

const DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const STORE_PATH = path.join(DIR, "rewrite-applications.json");

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readStore(): RewriteApplicationStore {
  if (!fs.existsSync(STORE_PATH)) {
    return { records: [] };
  }

  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Partial<RewriteApplicationStore>;

  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}

export function listRewriteApplications(): RewriteApplicationRecord[] {
  return readStore().records;
}

export function getRewriteApplicationsForSlug(
  slug: string
): RewriteApplicationRecord[] {
  return readStore().records.filter((record) => record.slug === slug);
}

export function createRewriteApplication(_input: {
  taskId: string;
  slug: string;
  sectionKey: RewriteSectionKey;
  appliedText: string;
}): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}
