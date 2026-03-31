// encyclopediaLiveStore.server.ts — read-only access to promoted corpus file

import fs from "node:fs";
import path from "node:path";
import type {
  LiveEncyclopediaPageRecord,
  LiveEncyclopediaStoreFile,
} from "./encyclopediaPipelineTypes";

const LIVE_DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const LIVE_FILE = path.join(LIVE_DIR, "live-encyclopedia-pages.json");

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readLiveStore(): LiveEncyclopediaStoreFile {
  if (!fs.existsSync(LIVE_FILE)) {
    return { records: [] };
  }
  const raw = fs.readFileSync(LIVE_FILE, "utf8");
  const parsed = JSON.parse(raw) as LiveEncyclopediaStoreFile;
  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}

export function getLiveEncyclopediaStorePath(): string {
  return LIVE_FILE;
}

export function readLiveEncyclopediaPageBySlug(
  slug: string
): LiveEncyclopediaPageRecord | undefined {
  return readLiveStore().records.find((r) => r.slug === slug);
}

export function upsertLiveEncyclopediaPage(
  _record: LiveEncyclopediaPageRecord
): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function listLiveEncyclopediaPages(): LiveEncyclopediaPageRecord[] {
  return readLiveStore().records;
}
