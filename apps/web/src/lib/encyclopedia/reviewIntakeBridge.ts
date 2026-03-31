/**
 * Migration-only legacy pipeline support.
 * Not part of operational encyclopedia system.
 * Use API-backed review + promotion instead.
 */

import fs from "fs";
import path from "path";
import type { CanonicalPageSnapshot } from "@/lib/encyclopedia/canonicalTypes";

type GenerationFile =
  | CanonicalPageSnapshot[]
  | {
      pages?: CanonicalPageSnapshot[];
      snapshots?: CanonicalPageSnapshot[];
      items?: CanonicalPageSnapshot[];
      records?: CanonicalPageSnapshot[];
    };

function extractSnapshots(input: GenerationFile): CanonicalPageSnapshot[] {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input.pages)) return input.pages;
  if (Array.isArray(input.snapshots)) return input.snapshots;
  if (Array.isArray(input.items)) return input.items;
  if (Array.isArray(input.records)) return input.records;
  throw new Error("Unsupported generation file shape");
}

export function loadCanonicalSnapshotsForApiIntake(filePath: string) {
  const absolute = path.resolve(process.cwd(), filePath);
  const raw = JSON.parse(fs.readFileSync(absolute, "utf-8")) as GenerationFile;
  return extractSnapshots(raw);
}
