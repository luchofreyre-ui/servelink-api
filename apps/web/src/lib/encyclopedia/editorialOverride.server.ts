// editorialOverride.server.ts — read-only

import fs from "node:fs";
import path from "node:path";
import type {
  EditorialOverrideFile,
  EditorialOverrideMode,
  EditorialOverrideRecord,
} from "./editorialOverrideTypes";

const DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const FILE = path.join(DIR, "editorial-overrides.json");

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readStore(): EditorialOverrideFile {
  if (!fs.existsSync(FILE)) {
    return { records: [] };
  }

  const raw = fs.readFileSync(FILE, "utf8");
  const parsed = JSON.parse(raw) as EditorialOverrideFile;

  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}

export function getEditorialOverrides(): EditorialOverrideRecord[] {
  return readStore().records;
}

export function getEditorialOverrideBySlug(
  slug: string
): EditorialOverrideRecord | null {
  return readStore().records.find((record) => record.slug === slug) ?? null;
}

export function upsertEditorialOverride(
  _slug: string,
  _mode: EditorialOverrideMode,
  _note: string
): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function deleteEditorialOverride(_slug: string): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export type EditorialOverrideSetResult = {
  slug: string;
  editorialOverrideMode: EditorialOverrideMode | null;
  editorialOverrideNote: string | null;
  updatedAt: string;
};

export function setEditorialOverride(
  _slug: string,
  _mode: EditorialOverrideMode | null,
  _note: string | null
): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function getEditorialOverrideFilePath(): string {
  return FILE;
}
