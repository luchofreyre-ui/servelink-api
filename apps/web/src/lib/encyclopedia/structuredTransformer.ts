import type { CanonicalPageSnapshot } from "./encyclopediaPipelineTypes";
import type { StructuredArticle, StructuredSection } from "./structuredTypes";
import { buildSeo } from "./seo/seoBuilder";
import { buildInternalLinks } from "./linking/internalLinkBuilder";

function structuredSectionSortRank(s: StructuredSection): number {
  if (s.kind === "meta_grid") return 0;
  if (s.kind === "link_list") return 2;
  return 1;
}

function normalizeUniqueInternalLinkSlugs(raw: string[] | undefined): string[] {
  return Array.from(
    new Map(
      (raw ?? [])
        .filter((s) => typeof s === "string" && s.trim() !== "")
        .map((s) => {
          const trimmed = s.trim();
          return [trimmed.toLowerCase(), trimmed] as const;
        })
    ).values()
  );
}

function riskLabel(level: CanonicalPageSnapshot["riskLevel"]): string {
  switch (level) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
  }
}

export function parseDecisionBox(body: string): {
  yes: string[];
  no: string[];
  partial: string[];
} {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const yes: string[] = [];
  const no: string[] = [];
  const partial: string[] = [];

  let mode: "yes" | "no" | "partial" | null = null;

  for (const line of lines) {
    if (/^YES\b/i.test(line)) {
      mode = "yes";
      continue;
    }
    if (/^NO\b/i.test(line)) {
      mode = "no";
      continue;
    }
    if (/^PARTIAL\b/i.test(line)) {
      mode = "partial";
      continue;
    }

    const cleaned = line.replace(/^[-*•]\s*/, "").trim();
    if (!cleaned) continue;

    if (mode === "yes") yes.push(cleaned);
    if (mode === "no") no.push(cleaned);
    if (mode === "partial") partial.push(cleaned);
  }

  return { yes, no, partial };
}

export function parseBulletItems(body: string): string[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*•]|\d+\./.test(line))
    .map((line) => line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

export function parseDiagnostics(body: string): Array<{ label: string; body: string }> {
  const chunks = body
    .split(/\n(?=(Type|Variation|Example)\s+[123]\b)/i)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const items: Array<{ label: string; body: string }> = [];

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;

    const label = lines[0];
    const rest = lines.slice(1).join(" ").trim();

    items.push({
      label,
      body: rest || label,
    });
  }

  return items.slice(0, 3);
}

/**
 * Maps a canonical pipeline snapshot into section blocks for structured rendering.
 */
export function transformSnapshotToStructured(
  snapshot: CanonicalPageSnapshot
): StructuredArticle {
  if (!snapshot.sections?.length) {
    console.error("[encyclopedia:render:failed]", {
      slug: snapshot.slug,
      reason: "missing_sections",
    });
    throw new Error(`Missing sections for ${snapshot.slug}`);
  }

  const sections: StructuredSection[] = [];

  const metaRows: Array<{ label: string; value: string }> = [
    { label: "Problem", value: snapshot.problem },
    { label: "Surface", value: snapshot.surface },
    { label: "Intent", value: snapshot.intent },
    { label: "Risk", value: riskLabel(snapshot.riskLevel) },
  ];

  sections.push({
    kind: "meta_grid",
    id: "at_a_glance",
    title: "At a glance",
    rows: metaRows,
  });

  const uniqueLinkSlugs = normalizeUniqueInternalLinkSlugs(snapshot.internalLinks);
  let pushedRelatedLinkList = false;

  for (const section of snapshot.sections) {
    if (section.key === "canThisBeFixed") {
      const parsed = parseDecisionBox(section.content ?? "");
      sections.push({
        kind: "decision_box",
        id: "section_canThisBeFixed",
        title: section.title,
        yes: parsed.yes,
        no: parsed.no,
        partial: parsed.partial,
      });
      continue;
    }

    if (section.key === "toolsRequired") {
      sections.push({
        kind: "tool_list",
        id: "section_toolsRequired",
        title: section.title,
        items: parseBulletItems(section.content ?? ""),
      });
      continue;
    }

    if (section.key === "recommendedProducts") {
      sections.push({
        kind: "product_list",
        id: "section_recommendedProducts",
        title: section.title,
        items: parseBulletItems(section.content ?? ""),
      });
      continue;
    }

    if (section.key === "visualDiagnostics") {
      sections.push({
        kind: "diagnostic_grid",
        id: "section_visualDiagnostics",
        title: section.title,
        items: parseDiagnostics(section.content ?? ""),
      });
      continue;
    }

    if (section.key === "relatedTopics") {
      sections.push({
        kind: "link_list",
        id: "section_relatedTopics",
        title: section.title,
        slugs: uniqueLinkSlugs,
      });
      pushedRelatedLinkList = true;
      continue;
    }

    sections.push({
      kind: "prose",
      id: `section_${section.key}`,
      title: section.title,
      body: section.content ?? "",
    });
  }

  if (snapshot.advancedNotes?.trim()) {
    sections.push({
      kind: "prose",
      id: "advanced_notes",
      title: "Advanced notes",
      body: snapshot.advancedNotes.trim(),
    });
  }

  if (!pushedRelatedLinkList && uniqueLinkSlugs.length > 0) {
    sections.push({
      kind: "link_list",
      id: "internal_links",
      title: "Related topics",
      slugs: uniqueLinkSlugs,
    });
  }

  sections.sort(
    (a, b) => structuredSectionSortRank(a) - structuredSectionSortRank(b)
  );

  return {
    title: snapshot.title,
    slug: snapshot.slug,
    sections,
    internalLinks: normalizeUniqueInternalLinkSlugs(snapshot.internalLinks).map((slug) => ({
      title: slug.replace(/-/g, " "),
      slug,
    })),
  };
}

function sectionRecordFromSnapshot(snapshot: CanonicalPageSnapshot): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of snapshot.sections ?? []) {
    if (typeof s?.key === "string") {
      out[s.key] = String(s.content ?? "");
    }
  }
  return out;
}

export function enhanceStructuredPage(snapshot: any, allPages: any[]) {
  const sections = snapshot?.sections && !Array.isArray(snapshot.sections) ? snapshot.sections : {};
  const resolvedSections =
    snapshot?.sections && Array.isArray(snapshot.sections)
      ? sectionRecordFromSnapshot(snapshot as CanonicalPageSnapshot)
      : (sections as Record<string, string>);

  const seo = buildSeo({
    surface: snapshot.surface,
    problem: snapshot.problem,
    intent: snapshot.intent,
    sections: resolvedSections,
  });

  const pages = (allPages ?? []).map((p: any) => {
    const pSeo =
      p?.seo && typeof p.seo === "object" && typeof p.seo.slug === "string"
        ? p.seo
        : buildSeo({
            surface: p.surface,
            problem: p.problem,
            intent: p.intent,
            sections: p?.sections && Array.isArray(p.sections) ? sectionRecordFromSnapshot(p) : {},
          });

    return {
      surface: p.surface,
      problem: p.problem,
      intent: p.intent,
      slug: pSeo.slug,
    };
  });

  const links = buildInternalLinks(
    {
      surface: snapshot.surface,
      problem: snapshot.problem,
      intent: snapshot.intent,
      slug: seo.slug,
    },
    pages,
  );

  return {
    ...snapshot,
    seo,
    internalLinks: links.map((l) => l.slug),
    internalLinkEntries: links.map((l) => ({
      title: `${l.problem} on ${l.surface}`,
      slug: l.slug,
    })),
  };
}
