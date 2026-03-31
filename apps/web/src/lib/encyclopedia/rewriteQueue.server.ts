import fs from "node:fs";
import path from "node:path";
import type {
  RewriteQueueStore,
  RewriteSectionKey,
  RewriteTask,
} from "./rewriteQueueTypes";

const DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const FILE_PATH = path.join(DIR, "rewrite-queue.json");

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readStore(): RewriteQueueStore {
  if (!fs.existsSync(FILE_PATH)) {
    return { records: [] };
  }
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8")) as RewriteQueueStore;
}

export function createRewriteTask(
  _slug: string,
  _section: RewriteSectionKey,
  _reason: string
): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function getRewriteTasks(slug: string): RewriteTask[] {
  return readStore().records.filter((r) => r.slug === slug);
}

export function getRewriteTasksForSlug(slug: string): RewriteTask[] {
  return getRewriteTasks(slug);
}

export function getRewriteTaskById(id: string): RewriteTask | null {
  return readStore().records.find((record) => record.id === id) ?? null;
}

export function updateRewriteTaskStatus(
  _id: string,
  _status: RewriteTask["status"]
): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function reopenRewriteTask(_id: string): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}
