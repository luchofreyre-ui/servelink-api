import fs from "node:fs";
import path from "node:path";
import type { RewriteSectionKey } from "./rewriteQueueTypes";
import type { RewriteDraftRecord, RewriteDraftStore } from "./rewriteDraftTypes";

const DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const STORE_PATH = path.join(DIR, "rewrite-drafts.json");

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readStore(): RewriteDraftStore {
  if (!fs.existsSync(STORE_PATH)) {
    return { records: [] };
  }

  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Partial<RewriteDraftStore>;

  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}

export function listRewriteDrafts(): RewriteDraftRecord[] {
  return readStore().records;
}

export function getRewriteDraftsForSlug(slug: string): RewriteDraftRecord[] {
  return readStore().records.filter((record) => record.slug === slug);
}

export function getRewriteDraftByTaskId(taskId: string): RewriteDraftRecord | null {
  return readStore().records.find((record) => record.taskId === taskId) ?? null;
}

export function upsertRewriteDraft(_input: {
  taskId: string;
  slug: string;
  sectionKey: RewriteSectionKey;
  draftText: string;
}): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function deleteRewriteDraft(_taskId: string): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}
