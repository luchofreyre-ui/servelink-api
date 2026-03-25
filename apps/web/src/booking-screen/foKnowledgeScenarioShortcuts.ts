import {
  selectFoKnowledgeLinksFromScreen,
  selectFoKnowledgeQuickSolvePrefillFromScreen,
} from "@/booking-screen/foKnowledgeScreenSelectors";

export interface FoScenarioShortcut {
  label: string;
  href: string;
  surfaceId: string;
  problemId: string;
  severity: "light" | "medium" | "heavy";
}

function buildHref(params: {
  bookingId?: string;
  surfaceId: string;
  problemId: string;
  severity: "light" | "medium" | "heavy";
}): string {
  const search = new URLSearchParams();

  if (params.bookingId) search.set("bookingId", params.bookingId);
  search.set("surfaceId", params.surfaceId);
  search.set("problemId", params.problemId);
  search.set("severity", params.severity);
  search.set("focusQuickSolve", "1");

  return `/fo/knowledge?${search.toString()}`;
}

function bookingIdFromScreen(screen: unknown): string | undefined {
  const s = screen && typeof screen === "object" ? (screen as Record<string, unknown>) : null;
  if (!s) return undefined;
  if (typeof s.bookingId === "string" && s.bookingId.trim()) return s.bookingId.trim();
  const b = s.booking;
  if (b && typeof b === "object" && typeof (b as { id?: string }).id === "string") {
    return (b as { id: string }).id.trim();
  }
  return undefined;
}

/** Deterministic text signals: API field, derived prefill query, and authority link titles/slugs. */
function scenarioHaystackFromScreen(screen: unknown): string {
  const s = screen && typeof screen === "object" ? (screen as Record<string, unknown>) : null;
  const parts: string[] = [];
  if (s && typeof s.suggestedSearchQuery === "string") parts.push(s.suggestedSearchQuery);
  const prefill = selectFoKnowledgeQuickSolvePrefillFromScreen(screen);
  if (prefill.suggestedSearchQuery) parts.push(prefill.suggestedSearchQuery);
  for (const link of selectFoKnowledgeLinksFromScreen(screen)) {
    parts.push(link.title);
    parts.push(link.slug.replace(/-/g, " "));
  }
  return parts.join(" ").toLowerCase();
}

export function selectFoScenarioShortcuts(screen: unknown): FoScenarioShortcut[] {
  const bookingId = bookingIdFromScreen(screen);
  const haystack = scenarioHaystackFromScreen(screen);

  const shortcuts: FoScenarioShortcut[] = [];

  if (haystack.includes("soap")) {
    shortcuts.push({
      label: "Soap scum on glass",
      surfaceId: "glass_shower_door",
      problemId: "soap_scum",
      severity: "heavy",
      href: buildHref({
        bookingId,
        surfaceId: "glass_shower_door",
        problemId: "soap_scum",
        severity: "heavy",
      }),
    });
  }

  if (haystack.includes("grease")) {
    shortcuts.push({
      label: "Kitchen grease buildup",
      surfaceId: "stovetop",
      problemId: "grease",
      severity: "medium",
      href: buildHref({
        bookingId,
        surfaceId: "stovetop",
        problemId: "grease",
        severity: "medium",
      }),
    });
  }

  if (haystack.includes("mildew")) {
    shortcuts.push({
      label: "Grout mildew",
      surfaceId: "grout",
      problemId: "mildew",
      severity: "medium",
      href: buildHref({
        bookingId,
        surfaceId: "grout",
        problemId: "mildew",
        severity: "medium",
      }),
    });
  }

  return shortcuts.slice(0, 3);
}
