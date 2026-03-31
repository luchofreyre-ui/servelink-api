import fs from "fs";
import path from "path";

export type CanonicalCleanupRow = {
  sourceArea: string;
  oldHref: string;
  preferredHref: string;
  reason: string;
  status: "needs_update" | "ok";
};

type LivePair = { source: string; destination: string };

function loadLivePairs(): LivePair[] {
  const candidates = [
    path.join(process.cwd(), "src/lib/encyclopedia/generated/liveEncyclopediaRedirects.json"),
    path.join(process.cwd(), "src/lib/encyclopedia/generated/executableEncyclopediaRedirects.json"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const raw = fs.readFileSync(p, "utf8");
      return JSON.parse(raw) as LivePair[];
    } catch {
      /* try next */
    }
  }
  return [];
}

/**
 * Focused scan: navigation, indexes, cluster/comparison/combo/detail, FO knowledge block.
 * One row per (file × live legacy path) when the file still contains that exact path string.
 */
const AUDIT_FILES_RELATIVE = [
  "src/authority/navigation/authorityNavigation.ts",
  "src/app/(public)/methods/page.tsx",
  "src/app/(public)/problems/page.tsx",
  "src/search/buildAuthoritySearchIndex.ts",
  "src/components/authority/AuthorityClusterPage.tsx",
  "src/components/authority/AuthorityComparisonPage.tsx",
  "src/components/authority/AuthorityCombinationPage.tsx",
  "src/components/authority/AuthorityDetailPage.tsx",
  "src/components/authority/AuthorityRelatedLinks.tsx",
  "src/components/booking-detail/franchise-owner/FoRecommendedKnowledgeBlock.tsx",
];

/**
 * Rows are only emitted when the legacy path appears as a literal substring.
 * Template links like `/methods/${slug}` do not match and are intentionally ignored.
 */
export function buildCanonicalCleanupAudit(): CanonicalCleanupRow[] {
  const pairs = loadLivePairs();
  const rows: CanonicalCleanupRow[] = [];
  const root = process.cwd();

  for (const rel of AUDIT_FILES_RELATIVE) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, "utf8");
    const area = rel.replace(/^src\//, "");

    for (const { source, destination } of pairs) {
      if (!text.includes(source)) continue;

      rows.push({
        sourceArea: area,
        oldHref: source,
        preferredHref: destination,
        reason:
          "Literal legacy path still present; prefer pipeline encyclopedia URL for internal navigation.",
        status: "needs_update",
      });
    }
  }

  rows.sort((a, b) => a.sourceArea.localeCompare(b.sourceArea) || a.oldHref.localeCompare(b.oldHref));
  return rows;
}

export function summarizeCanonicalCleanupAudit(rows: CanonicalCleanupRow[]): {
  totalFindings: number;
  needsUpdate: number;
} {
  return {
    totalFindings: rows.length,
    needsUpdate: rows.filter((r) => r.status === "needs_update").length,
  };
}
