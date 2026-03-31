// evidenceAttachment.server.ts — read-only

import fs from "node:fs";
import path from "node:path";
import type {
  AttachedEvidenceFile,
  AttachedEvidenceRecord,
} from "./evidenceAttachmentTypes";

const DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const FILE = path.join(DIR, "attached-evidence.json");

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readStore(): AttachedEvidenceFile {
  if (!fs.existsSync(FILE)) {
    return { records: [] };
  }

  const raw = fs.readFileSync(FILE, "utf8");
  const parsed = JSON.parse(raw) as AttachedEvidenceFile;

  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}

export function getAttachedEvidenceRecords(): AttachedEvidenceRecord[] {
  return readStore().records;
}

export function getAttachedEvidenceBySlug(slug: string): AttachedEvidenceRecord | null {
  return readStore().records.find((record) => record.slug === slug) ?? null;
}

export const getAttachedEvidenceForSlug = getAttachedEvidenceBySlug;

export function upsertAttachedEvidence(_slug: string, _evidenceIds: string[]): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function clearAttachedEvidence(_slug: string): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function getAttachedEvidenceFilePath(): string {
  return FILE;
}

export function addAttachedEvidence(_slug: string, _evidenceIds: string[]): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function removeAttachedEvidence(_slug: string, _evidenceIds: string[]): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function replaceAttachedEvidence(_slug: string, _evidenceIds: string[]): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}
