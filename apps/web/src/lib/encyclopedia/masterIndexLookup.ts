import fs from "node:fs";

import { encyclopediaIndexEntrySchema } from "./schema";

export interface MasterIndexLookup {
  ids: Set<string>;
  slugs: Set<string>;
}

export function buildMasterIndexLookupFromEntries(
  entries: ReadonlyArray<{ id: string; slug: string }>,
): MasterIndexLookup {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const e of entries) {
    ids.add(e.id);
    slugs.add(e.slug);
  }
  return { ids, slugs };
}

export function loadMasterIndexLookup(masterIndexPath: string): MasterIndexLookup {
  const raw = JSON.parse(fs.readFileSync(masterIndexPath, "utf8")) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("master-index.json must be an array.");
  }
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const row of raw) {
    const entry = encyclopediaIndexEntrySchema.parse(row);
    ids.add(entry.id);
    slugs.add(entry.slug);
  }
  return { ids, slugs };
}

export function candidateExistsInMasterIndex(
  lookup: MasterIndexLookup,
  candidate: { id: string; slug: string; normalizedSlug?: string },
): boolean {
  if (lookup.ids.has(candidate.id) || lookup.slugs.has(candidate.slug)) {
    return true;
  }
  if (candidate.normalizedSlug !== undefined && lookup.slugs.has(candidate.normalizedSlug)) {
    return true;
  }
  return false;
}
