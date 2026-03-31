import fs from "node:fs";
import path from "node:path";
import type {
  RepairCompletionRecord,
  RepairCompletionStatus,
  RepairCompletionStore,
} from "./repairCompletionTypes";

const STORE_PATH = path.join(
  process.cwd(),
  "content-batches",
  "encyclopedia",
  "repair-completion.json"
);

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readStore(): RepairCompletionStore {
  if (!fs.existsSync(STORE_PATH)) {
    return { records: [] };
  }

  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Partial<RepairCompletionStore>;

  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}

export function listRepairCompletionRecords(): RepairCompletionRecord[] {
  return readStore().records;
}

export function getRepairCompletionForSlug(
  slug: string
): RepairCompletionRecord | null {
  return readStore().records.find((record) => record.slug === slug) ?? null;
}

export function upsertRepairCompletion(
  _slug: string,
  _status: RepairCompletionStatus,
  _note?: string | null
): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}
