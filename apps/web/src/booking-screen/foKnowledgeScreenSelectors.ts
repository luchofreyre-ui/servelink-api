function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export type FoScreenKnowledgeLink = {
  kind: string;
  slug: string;
  pathname: string;
  title: string;
  sourceTags: string[];
};

export type FoAuthorityTagSource = "persisted" | "derived" | null;

/**
 * Parses `knowledgeLinks` from `GET /api/v1/bookings/:id/screen` (FO role).
 */
export function selectFoKnowledgeLinksFromScreen(
  screen: unknown,
): FoScreenKnowledgeLink[] {
  const s = asRecord(screen);
  const raw = s?.knowledgeLinks;
  if (!Array.isArray(raw)) return [];
  const out: FoScreenKnowledgeLink[] = [];
  for (const item of raw) {
    const r = asRecord(item);
    if (!r) continue;
    const pathname = typeof r.pathname === "string" ? r.pathname : "";
    const title = typeof r.title === "string" ? r.title : "";
    if (!pathname || !title) continue;
    const kind = typeof r.kind === "string" ? r.kind : "";
    const slug = typeof r.slug === "string" ? r.slug : "";
    const sourceTags = Array.isArray(r.sourceTags)
      ? r.sourceTags.filter((t): t is string => typeof t === "string")
      : [];
    out.push({ kind, slug, pathname, title, sourceTags });
  }
  return out;
}

export function selectFoAuthorityTagSourceFromScreen(
  screen: unknown,
): FoAuthorityTagSource {
  const s = asRecord(screen);
  const v = s?.authorityTagSource;
  if (v === "persisted" || v === "derived") return v;
  return null;
}

export type FoAuthorityReviewStatus = "auto" | "reviewed" | "overridden";

export function selectFoAuthorityReviewStatusFromScreen(
  screen: unknown,
): FoAuthorityReviewStatus | null {
  const s = asRecord(screen);
  const v = s?.authorityReviewStatus;
  if (v === "auto" || v === "reviewed" || v === "overridden") return v;
  return null;
}

export function selectFoAuthorityHasTaggedRowsFromScreen(
  screen: unknown,
): boolean {
  const s = asRecord(screen);
  return s?.authorityHasTaggedRows === true;
}
