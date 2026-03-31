/**
 * Migration-only: file-backed live-encyclopedia-pages.json writes for local scripts.
 * Not part of operational encyclopedia system.
 */

import fs from "node:fs";
import path from "node:path";
import type {
  LiveEncyclopediaPageRecord,
  LiveEncyclopediaStoreFile,
} from "../../../../src/lib/encyclopedia/encyclopediaPipelineTypes";

const LIVE_DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const LIVE_FILE = path.join(LIVE_DIR, "live-encyclopedia-pages.json");

function ensureLiveFile(): void {
  fs.mkdirSync(LIVE_DIR, { recursive: true });
  if (!fs.existsSync(LIVE_FILE)) {
    const initial: LiveEncyclopediaStoreFile = { records: [] };
    fs.writeFileSync(LIVE_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

function readLiveStore(): LiveEncyclopediaStoreFile {
  ensureLiveFile();
  const raw = fs.readFileSync(LIVE_FILE, "utf8");
  const parsed = JSON.parse(raw) as LiveEncyclopediaStoreFile;
  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}

function writeLiveStore(data: LiveEncyclopediaStoreFile): void {
  ensureLiveFile();
  const normalized: LiveEncyclopediaStoreFile = {
    records: [...data.records].sort((a, b) => a.slug.localeCompare(b.slug)),
  };
  fs.writeFileSync(LIVE_FILE, JSON.stringify(normalized, null, 2), "utf8");
}

export function upsertLiveEncyclopediaPage(
  record: LiveEncyclopediaPageRecord
): void {
  const store = readLiveStore();
  const idx = store.records.findIndex((r) => r.slug === record.slug);
  if (idx >= 0) {
    store.records[idx] = record;
  } else {
    store.records.push(record);
  }
  writeLiveStore(store);
}
