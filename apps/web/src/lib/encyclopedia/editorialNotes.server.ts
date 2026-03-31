import fs from "node:fs";
import path from "node:path";
import type { EditorialNote, EditorialNotesStore } from "./editorialNotesTypes";

const DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const FILE_PATH = path.join(DIR, "editorial-notes.json");

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readStore(): EditorialNotesStore {
  if (!fs.existsSync(FILE_PATH)) {
    return { records: [] };
  }
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8")) as EditorialNotesStore;
}

export function getEditorialNotes(slug: string): EditorialNote[] {
  return readStore().records.filter((r) => r.slug === slug);
}

export function getEditorialNotesForSlug(slug: string): EditorialNote[] {
  return getEditorialNotes(slug);
}

export function addEditorialNote(_slug: string, _note: string): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function deleteEditorialNote(_id: string): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}
