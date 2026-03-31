import fs from "node:fs";
import path from "node:path";
import type {
  RepairEventType,
  RepairHistoryEvent,
  RepairHistoryStore,
} from "./repairHistoryTypes";

const DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const FILE_PATH = path.join(DIR, "repair-history.json");

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readStore(): RepairHistoryStore {
  if (!fs.existsSync(FILE_PATH)) {
    return { records: [] };
  }
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8")) as RepairHistoryStore;
}

export function logRepairEvent(
  _slug: string,
  _type: RepairEventType,
  _metadata?: Record<string, unknown>
): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function getRepairHistory(slug: string): RepairHistoryEvent[] {
  return readStore().records.filter((r) => r.slug === slug);
}
