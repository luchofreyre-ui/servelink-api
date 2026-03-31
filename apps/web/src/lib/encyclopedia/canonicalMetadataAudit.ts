import type { Metadata } from "next";

import {
  buildAuthorityMethodDetailMetadata,
  buildAuthorityProblemDetailMetadata,
} from "@/authority/metadata/authorityMetadata";
import { PUBLIC_SITE_URL } from "@/components/marketing/precision-luxury/content/publicContentRegistry";
import type { AuthorityMethodPageData, AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";

import executableRedirects from "./generated/executableEncyclopediaRedirects.json";
import { resolveCanonicalMetadataHref } from "./encyclopediaCanonicalMetadataHref";

export type CanonicalMetadataAuditRow = {
  sourceArea: string;
  legacyPath: string;
  preferredPath: string;
  status: "needs_update" | "ok";
};

type RedirectRow = { source: string; destination: string; permanent: boolean };

function pathnameFromMetadataCanonical(meta: Metadata): string | null {
  const c = meta.alternates?.canonical;
  if (!c) return null;
  const s = typeof c === "string" ? c : String(c);
  try {
    return new URL(s).pathname;
  } catch {
    if (s.startsWith(PUBLIC_SITE_URL)) {
      const rest = s.slice(PUBLIC_SITE_URL.length);
      return rest.startsWith("/") ? rest : `/${rest}`;
    }
    return s.startsWith("/") ? s : null;
  }
}

function minimalMethodPage(slug: string): AuthorityMethodPageData {
  return {
    slug,
    title: "Audit",
    summary: "Summary",
    whatItIs: "",
    whyItWorks: "",
    bestFor: "",
    avoidOn: "",
    commonMistakes: [],
    whenItFails: "",
    recommendedTools: [],
    recommendedChemicals: [],
    relatedSurfaces: [],
    relatedProblems: [],
    relatedMethods: [],
  };
}

function minimalProblemPage(slug: string): AuthorityProblemPageData {
  return {
    slug,
    title: "Audit",
    description: "D",
    summary: "S",
    category: "unknown",
    symptoms: [],
    causes: [],
    whatItUsuallyIs: "",
    whyItHappens: "",
    commonOn: "",
    bestMethods: "",
    avoidMethods: "",
    recommendedTools: [],
    recommendedChemicals: [],
    commonMistakes: [],
    whenItFails: "",
    whenToEscalate: "",
    relatedProblems: [],
    relatedMethods: [],
    relatedSurfaces: [],
  };
}

/**
 * Audit canonical metadata alignment for pipeline-migrated legacy paths (exact match only).
 */
export function buildCanonicalMetadataAudit(): CanonicalMetadataAuditRow[] {
  const redirects = executableRedirects as RedirectRow[];
  const rows: CanonicalMetadataAuditRow[] = [];

  for (const { source, destination } of redirects) {
    const resolved = resolveCanonicalMetadataHref(source);
    rows.push({
      sourceArea: "resolveCanonicalMetadataHref",
      legacyPath: source,
      preferredPath: destination,
      status: resolved === destination ? "ok" : "needs_update",
    });
  }

  for (const { source, destination } of redirects) {
    if (source.startsWith("/methods/")) {
      const slug = source.slice("/methods/".length);
      const meta = buildAuthorityMethodDetailMetadata(minimalMethodPage(slug));
      const p = pathnameFromMetadataCanonical(meta);
      rows.push({
        sourceArea: "buildAuthorityMethodDetailMetadata",
        legacyPath: source,
        preferredPath: destination,
        status: p === destination ? "ok" : "needs_update",
      });
    } else if (source.startsWith("/problems/")) {
      const slug = source.slice("/problems/".length);
      const meta = buildAuthorityProblemDetailMetadata(minimalProblemPage(slug));
      const p = pathnameFromMetadataCanonical(meta);
      rows.push({
        sourceArea: "buildAuthorityProblemDetailMetadata",
        legacyPath: source,
        preferredPath: destination,
        status: p === destination ? "ok" : "needs_update",
      });
    }
  }

  rows.sort(
    (a, b) =>
      a.sourceArea.localeCompare(b.sourceArea) ||
      a.legacyPath.localeCompare(b.legacyPath),
  );
  return rows;
}

export function summarizeCanonicalMetadataAudit(rows: CanonicalMetadataAuditRow[]): {
  total: number;
  ok: number;
  needsUpdate: number;
} {
  return {
    total: rows.length,
    ok: rows.filter((r) => r.status === "ok").length,
    needsUpdate: rows.filter((r) => r.status === "needs_update").length,
  };
}
