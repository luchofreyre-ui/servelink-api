// publishQueue.server.ts — read-only access to legacy publish queue file

import fs from "node:fs";
import path from "node:path";
import type {
  PublishQueueFile,
  PublishQueueRecord,
  PublishQueueStatus,
} from "./publishQueueTypes";

const DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const FILE = path.join(DIR, "publish-queue.json");

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readQueueFile(): PublishQueueFile {
  if (!fs.existsSync(FILE)) {
    return { records: [] };
  }

  const raw = fs.readFileSync(FILE, "utf8");
  const parsed = JSON.parse(raw) as PublishQueueFile;

  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}

export function getPublishQueueRecords(): PublishQueueRecord[] {
  return readQueueFile().records;
}

export function getPublishQueueFilePath(): string {
  return FILE;
}

export function upsertPublishQueueRecord(
  _input: Pick<PublishQueueRecord, "slug" | "title" | "status"> & {
    error?: string;
  }
): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function queueApprovedPages(
  _pages: Array<{ slug: string; title: string }>
): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function clearPublishQueue(): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function removePublishQueueRecord(_slug: string): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function updatePublishQueueStatus(
  _slug: string,
  _status: PublishQueueStatus,
  _error?: string
): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}
