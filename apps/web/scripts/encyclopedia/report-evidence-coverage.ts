/**
 * Matrix coverage: unresolved evidence gaps + live corpus gaps (canonical matching).
 *
 * Matching order: normalize → alias → compare (via canonicalPairKey).
 *
 * Run from apps/web: npx tsx scripts/encyclopedia/report-evidence-coverage.ts
 */

import {
  canonicalPairKey,
  canonicalizeLivePagePair,
  explainEvidenceResolution,
  resolveEvidence,
} from "../../src/lib/encyclopedia/evidence/evidenceResolver";
import { CLEANING_EVIDENCE_CATALOG } from "../../src/lib/encyclopedia/evidence/cleaningEvidenceCatalog";
import {
  TAXONOMY_PROBLEMS,
  TAXONOMY_SURFACES,
} from "../../src/lib/encyclopedia/evidence/cleaningMatrixTaxonomy";
import { normalizeApiOrigin } from "../../src/lib/env";

type ListItem = { surface?: string; problem?: string; intent?: string };

async function fetchLiveList(apiBase: string): Promise<ListItem[]> {
  const url = `${apiBase.replace(/\/$/, "")}/encyclopedia/list`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { ok?: boolean; items?: ListItem[] };
  if (!Array.isArray(data.items)) {
    throw new Error(`Unexpected encyclopedia list shape (missing items[])`);
  }
  return data.items;
}

async function main() {
  const apiBase = `${normalizeApiOrigin(
    process.env.API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
      "http://localhost:3001",
  )}/api/v1`;

  let items: ListItem[] = [];
  let liveListOk = false;
  try {
    items = await fetchLiveList(apiBase);
    liveListOk = true;
  } catch (err) {
    console.warn(
      "Live list fetch failed; corpus-gap + UNMATCHED PAGE sections skipped:",
      err instanceof Error ? err.message : err,
    );
  }

  /** Keys for every matrix cell (normalize → alias on both axes). */
  const matrixCanonicalKeys = new Set<string>();
  for (const surface of TAXONOMY_SURFACES) {
    for (const problem of TAXONOMY_PROBLEMS) {
      matrixCanonicalKeys.add(canonicalPairKey(surface, problem));
    }
  }

  const repairedMatrixKeys = matrixCanonicalKeys;

  // Build surfaces from BOTH:
  // 1) canonical matrix (post-alias keys)
  // 2) evidence catalog (source of truth; allows masonry recognition even if not in matrix yet)
  const repairedTaxonomySurfaces = new Set<string>([
    ...Array.from(repairedMatrixKeys).map((k) => k.split("::")[0]),
    ...CLEANING_EVIDENCE_CATALOG.map((e) => e.surface),
  ]);

  // Problems come from repaired matrix keys (post-alias), plus evidence-backed problems.
  const repairedTaxonomyProblems = new Set<string>([
    ...Array.from(repairedMatrixKeys).map((k) => k.split("::")[1]),
    ...CLEANING_EVIDENCE_CATALOG.map((e) => e.problem),
  ]);

  for (const key of repairedMatrixKeys) {
    const [s, p] = key.split("::");
    void s;
    void p;
  }

  /** One entry per distinct live page (surface+problem), canonical key. */
  const pageCanonicalKeys = new Set<string>();
  if (liveListOk) {
    for (const item of items) {
      if (typeof item.surface !== "string" || typeof item.problem !== "string") {
        continue;
      }
      pageCanonicalKeys.add(canonicalPairKey(item.surface, item.problem));
    }
  }

  // --- Evidence gaps (catalog): same aggregation as before ---
  const unresolvedEvidence = new Map<string, { count: number; examples: string[] }>();

  for (const surface of TAXONOMY_SURFACES) {
    for (const problem of TAXONOMY_PROBLEMS) {
      if (resolveEvidence(surface, problem)) continue;

      const ex = explainEvidenceResolution(surface, problem);
      const key = `${ex.matchedSurface} + ${ex.matchedProblem}`;
      const label = `${surface} + ${problem}`;
      const cur = unresolvedEvidence.get(key);
      if (cur) {
        cur.count += 1;
        if (cur.examples.length < 5) cur.examples.push(label);
      } else {
        unresolvedEvidence.set(key, { count: 1, examples: [label] });
      }
    }
  }

  const sortedEvidence = [...unresolvedEvidence.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  );

  const evidenceTotal = sortedEvidence.reduce((s, [, v]) => s + v.count, 0);
  const matrixCells = TAXONOMY_SURFACES.length * TAXONOMY_PROBLEMS.length;

  console.log(
    `Unresolved evidence (no catalog row): ${evidenceTotal} (of ${matrixCells} matrix cells)\n`,
  );
  console.log("By canonical matched surface + problem (frequency):\n");

  for (const [key, { count, examples }] of sortedEvidence) {
    console.log(`${key}: ${count}`);
    if (examples.length) {
      console.log(`  e.g. ${examples.join("; ")}`);
    }
  }

  if (sortedEvidence.length === 0) {
    console.log("(full matrix has evidence rows)\n");
  } else {
    console.log("");
  }

  if (liveListOk) {
    const corpusGaps: { surface: string; problem: string }[] = [];
    for (const surface of TAXONOMY_SURFACES) {
      for (const problem of TAXONOMY_PROBLEMS) {
        if (!resolveEvidence(surface, problem)) continue;
        const k = canonicalPairKey(surface, problem);
        if (!pageCanonicalKeys.has(k)) {
          corpusGaps.push({ surface, problem });
        }
      }
    }

    console.log(
      `Corpus gaps (evidence OK, no matching live page by canonical key): ${corpusGaps.length} (of ${matrixCells} matrix cells)`,
    );
    if (corpusGaps.length > 0 && corpusGaps.length <= 25) {
      for (const g of corpusGaps) {
        console.log(`  - ${g.surface} + ${g.problem}`);
      }
    } else if (corpusGaps.length > 25) {
      console.log(`  (first 10)`);
      for (const g of corpusGaps.slice(0, 10)) {
        console.log(`  - ${g.surface} + ${g.problem}`);
      }
    }

    console.log("");
    const aliasFixable: Array<{ surface: string; problem: string; canonical: string }> = [];
    const offTaxonomy: Array<{ surface: string; problem: string; canonical: string }> = [];

    const seenRawPairs = new Set<string>();
    const seenOffTaxonomy = new Set<string>();
    for (const item of items) {
      if (typeof item.surface !== "string" || typeof item.problem !== "string") continue;

      const c = canonicalizeLivePagePair(item.surface, item.problem);
      const matchedAxes =
        repairedTaxonomySurfaces.has(c.canonicalSurface) &&
        repairedTaxonomyProblems.has(c.canonicalProblem);

      // force masonry recognition if evidence exists
      const isEvidenceBacked = CLEANING_EVIDENCE_CATALOG.some(
        (e) => e.surface === c.canonicalSurface,
      );

      const finalMatchedAxes =
        (matchedAxes || isEvidenceBacked) &&
        repairedTaxonomyProblems.has(c.canonicalProblem);

      const matched = finalMatchedAxes && matrixCanonicalKeys.has(c.canonicalKey);
      const rawKey = `${c.normalizedSurface}::${c.normalizedProblem}`;
      if (seenRawPairs.has(rawKey)) continue;
      seenRawPairs.add(rawKey);

      // TEMP DEBUG requested: show raw mismatches
      if (!finalMatchedAxes) {
        if (!seenOffTaxonomy.has(rawKey)) {
          seenOffTaxonomy.add(rawKey);
          console.log("UNMATCHED PAGE:", item.surface, item.problem);
        }
      }

      const row = { surface: item.surface, problem: item.problem, canonical: c.canonicalKey };
      if (finalMatchedAxes && rawKey !== c.canonicalKey) aliasFixable.push(row);
      else if (!finalMatchedAxes) offTaxonomy.push(row);
    }

    function printGroup(title: string, rows: Array<{ surface: string; problem: string; canonical: string }>) {
      console.log(`\n${title}: ${rows.length}`);
      for (const r of rows.slice(0, 25)) {
        console.log(`  - ${r.surface} + ${r.problem}  →  ${r.canonical.replace("::", " + ")}`);
      }
      if (rows.length > 25) {
        console.log(`  (and ${rows.length - 25} more)`);
      }
    }

    printGroup("Live pages (alias-fixable into taxonomy)", aliasFixable);
    printGroup("Live pages (off-taxonomy)", offTaxonomy);
  } else {
    console.log(
      "(Live corpus comparison skipped — run with API up to see corpus gaps vs canonical keys.)",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
