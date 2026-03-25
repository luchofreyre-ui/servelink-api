import { buildFoKnowledgeHref } from "@/components/knowledge/fo/buildFoKnowledgeHref";

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

/** Hub CTAs: Quick Solve + encyclopedia search, with optional structured prefill. */
export interface FoKnowledgeHubActionLink {
  label: string;
  href: string;
  emphasis?: "primary" | "secondary";
}

export interface FoKnowledgeQuickSolvePrefill {
  surfaceId?: string;
  problemId?: string;
  severity?: "light" | "medium" | "heavy";
  suggestedSearchQuery?: string;
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSeverity(value: unknown): "light" | "medium" | "heavy" | undefined {
  return value === "light" || value === "medium" || value === "heavy" ? value : undefined;
}

/**
 * Authority encyclopedia slugs (from FO `knowledgeLinks`) → FO Quick Solve catalog surface ids.
 * Only includes mappings that exist in the API quick-solve scenario catalog.
 */
const AUTHORITY_SURFACE_SLUG_TO_QUICK_SOLVE_SURFACE: Record<string, string> = {
  "shower-glass": "glass_shower_door",
  tile: "tile",
  "stainless-steel": "stainless_steel",
  "granite-countertops": "granite_countertop",
};

/**
 * Authority problem slugs → FO Quick Solve catalog problem ids.
 */
const AUTHORITY_PROBLEM_SLUG_TO_QUICK_SOLVE_PROBLEM: Record<string, string> = {
  "soap-scum": "soap_scum",
  "light-mildew": "mildew",
  "grease-buildup": "grease",
  "stuck-on-residue": "food_residue",
  "dust-buildup": "dust_buildup",
  "general-soil": "dirt_buildup",
};

/** Pairs that exist in `KNOWLEDGE_SCENARIOS` (surface|problem → default severity). */
const QUICK_SOLVE_PAIR_SEVERITY = new Map<string, "light" | "medium" | "heavy">([
  ["glass_shower_door|soap_scum", "light"],
  ["tile|soap_scum", "medium"],
  ["grout|mildew", "medium"],
  ["stainless_steel|grease", "medium"],
  ["stovetop|grease", "heavy"],
  ["granite_countertop|food_residue", "light"],
  ["hardwood_floor|dirt_buildup", "medium"],
  ["baseboard|dust_buildup", "medium"],
  ["toilet_bowl|mineral_scale", "heavy"],
  ["sink_faucet|hard_water_spots", "medium"],
  ["microwave_interior|grease", "medium"],
]);

function quickSolveSeverityForPair(surfaceId: string, problemId: string): "light" | "medium" | "heavy" | undefined {
  return QUICK_SOLVE_PAIR_SEVERITY.get(`${surfaceId}|${problemId}`);
}

/**
 * Optional explicit fields from the booking screen payload (forward-compatible).
 */
export function selectFoKnowledgeQuickSolvePrefillFromScreen(
  screen: unknown,
): FoKnowledgeQuickSolvePrefill {
  const s = asRecord(screen);
  const explicitSurface = normalize(s?.recommendedSurfaceId) || undefined;
  const explicitProblem = normalize(s?.recommendedProblemId) || undefined;
  const explicitSeverity = normalizeSeverity(s?.recommendedSeverity);
  const explicitQuery = normalize(s?.suggestedSearchQuery) || undefined;

  const links = selectFoKnowledgeLinksFromScreen(screen);

  let surfaceId: string | undefined;
  let problemId: string | undefined;
  let severity: "light" | "medium" | "heavy" | undefined;

  if (explicitSurface && explicitProblem) {
    const pairSev = quickSolveSeverityForPair(explicitSurface, explicitProblem);
    if (pairSev) {
      surfaceId = explicitSurface;
      problemId = explicitProblem;
      severity = explicitSeverity ?? pairSev;
    }
  }

  if (!surfaceId || !problemId) {
    const surfaceSlug = links.find((l) => l.kind === "surface")?.slug;
    const problemSlug = links.find((l) => l.kind === "problem")?.slug;
    const mappedSurface = surfaceSlug
      ? AUTHORITY_SURFACE_SLUG_TO_QUICK_SOLVE_SURFACE[surfaceSlug]
      : undefined;
    const mappedProblem = problemSlug
      ? AUTHORITY_PROBLEM_SLUG_TO_QUICK_SOLVE_PROBLEM[problemSlug]
      : undefined;
    if (mappedSurface && mappedProblem) {
      const pairSev = quickSolveSeverityForPair(mappedSurface, mappedProblem);
      if (pairSev) {
        surfaceId = mappedSurface;
        problemId = mappedProblem;
        severity = explicitSeverity ?? pairSev;
      }
    }
  }

  const titles = links
    .filter((l) => l.kind === "problem" || l.kind === "surface")
    .map((l) => l.title.trim())
    .filter(Boolean);
  const derivedQuery =
    titles.length > 0 ? Array.from(new Set(titles)).join(" ") : undefined;

  return {
    surfaceId,
    problemId,
    severity,
    suggestedSearchQuery: explicitQuery ?? derivedQuery,
  };
}

export function selectFoKnowledgeHubActionLinksFromScreen(
  screen: unknown,
  bookingId: string,
): FoKnowledgeHubActionLink[] {
  const prefill = selectFoKnowledgeQuickSolvePrefillFromScreen(screen);

  return [
    {
      label: "Open Quick Solve",
      href: buildFoKnowledgeHref(
        {
          bookingId,
          surfaceId: prefill.surfaceId,
          problemId: prefill.problemId,
          severity: prefill.severity,
        },
        { focusQuickSolve: true },
      ),
      emphasis: "primary",
    },
    {
      label: "Search Knowledge",
      href: buildFoKnowledgeHref({
        bookingId,
        q: prefill.suggestedSearchQuery,
      }),
      emphasis: "secondary",
    },
  ];
}
