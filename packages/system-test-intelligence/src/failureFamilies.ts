import type { SystemTestRichEvidence } from "./types";

/** Bump when family signature / clustering rules change (triggers re-sync). */
export const SYSTEM_TEST_FAILURE_FAMILY_VERSION = "v1" as const;

export type FailureFamilyMatchBasis =
  | "assertion_locator"
  | "assertion_selector"
  | "assertion_route"
  | "route_error"
  | "action_locator"
  | "message_locator"
  | "message_route"
  | "fallback_file_assertion";

export type FailureFamilyTrendKind =
  | "worsening"
  | "improving"
  | "stable"
  | "reactivated";

export type FailureFamilyStatusKind =
  | "active"
  | "quiet"
  | "resolved_candidate";

export type FailureFamilySignatureInput = {
  file: string;
  shortMessage: string;
  rich: SystemTestRichEvidence;
};

export type SelectedFailureFamilySignature = {
  matchBasis: FailureFamilyMatchBasis;
  /** Stable payload used for hashing (normalized segments). */
  signaturePayload: string;
  /** Human-debug segments for primary* fields. */
  primaryAssertionType: string | null;
  primaryLocator: string | null;
  primarySelector: string | null;
  primaryRouteUrl: string | null;
  primaryActionName: string | null;
  primaryErrorCode: string | null;
};

const GENERIC_TIMEOUT_RE =
  /^(timeout|timed out|waiting failed|test timeout)\b/i;

function fileStem(filePath: string): string {
  const norm = filePath.replace(/\\/g, "/");
  const base = norm.split("/").pop() ?? norm;
  const dot = base.lastIndexOf(".");
  return (dot > 0 ? base.slice(0, dot) : base).toLowerCase().trim();
}

export function normalizeLocatorOrSelector(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 240);
}

export function normalizeRouteUrl(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  try {
    const u = raw.trim();
    if (u.startsWith("http://") || u.startsWith("https://")) {
      const parsed = new URL(u);
      return `${parsed.pathname}`.toLowerCase().replace(/\s+/g, "");
    }
    return u.split("?")[0]!.toLowerCase().replace(/\s+/g, "").slice(0, 320);
  } catch {
    return raw.trim().toLowerCase().split("?")[0]!.slice(0, 320);
  }
}

export function normalizedMessageHead(shortMessage: string, maxLen = 80): string {
  const line = shortMessage.split(/\r?\n/)[0]?.trim() ?? "";
  const collapsed = line.replace(/\s+/g, " ").toLowerCase();
  return collapsed.slice(0, maxLen);
}

function isMeaningfulMessageHead(head: string): boolean {
  if (head.length < 10) return false;
  if (GENERIC_TIMEOUT_RE.test(head) && head.length < 24) return false;
  return true;
}

function hasConcreteAnchor(input: FailureFamilySignatureInput): boolean {
  const { rich, shortMessage } = input;
  const loc = normalizeLocatorOrSelector(rich.locator ?? rich.selector);
  const route = normalizeRouteUrl(rich.routeUrl);
  const code = rich.errorCode?.trim();
  const head = normalizedMessageHead(shortMessage);
  return Boolean(
    loc ||
      route ||
      code ||
      (isMeaningfulMessageHead(head) && head.length >= 12),
  );
}

/**
 * Layered deterministic family key: first matching rule with required anchors.
 */
export function selectFailureFamilySignature(
  input: FailureFamilySignatureInput,
): SelectedFailureFamilySignature | null {
  if (!hasConcreteAnchor(input)) {
    return null;
  }

  const { file, shortMessage, rich } = input;
  const assertion = rich.assertionType?.trim().toLowerCase() ?? "";
  const loc = normalizeLocatorOrSelector(rich.locator);
  const sel = normalizeLocatorOrSelector(rich.selector);
  const route = normalizeRouteUrl(rich.routeUrl);
  const action = rich.actionName?.trim().toLowerCase() ?? "";
  const err = rich.errorCode?.trim() ?? "";
  const head = normalizedMessageHead(shortMessage);
  const stem = fileStem(file);

  const tryAssertionLoc =
    assertion && loc ?
      {
        matchBasis: "assertion_locator" as const,
        signaturePayload: `${assertion}\0${loc}`,
        primaryAssertionType: assertion,
        primaryLocator: rich.locator ?? null,
        primarySelector: null,
        primaryRouteUrl: rich.routeUrl ?? null,
        primaryActionName: rich.actionName ?? null,
        primaryErrorCode: err || null,
      }
    : null;

  if (tryAssertionLoc) {
    return tryAssertionLoc;
  }

  if (assertion && sel) {
    return {
      matchBasis: "assertion_selector",
      signaturePayload: `${assertion}\0${sel}`,
      primaryAssertionType: assertion,
      primaryLocator: null,
      primarySelector: rich.selector ?? null,
      primaryRouteUrl: rich.routeUrl ?? null,
      primaryActionName: rich.actionName ?? null,
      primaryErrorCode: err || null,
    };
  }

  if (assertion && route) {
    return {
      matchBasis: "assertion_route",
      signaturePayload: `${assertion}\0${route}`,
      primaryAssertionType: assertion,
      primaryLocator: rich.locator ?? null,
      primarySelector: rich.selector ?? null,
      primaryRouteUrl: rich.routeUrl ?? null,
      primaryActionName: rich.actionName ?? null,
      primaryErrorCode: err || null,
    };
  }

  if (err && route) {
    return {
      matchBasis: "route_error",
      signaturePayload: `${err}\0${route}`,
      primaryAssertionType: assertion || null,
      primaryLocator: rich.locator ?? null,
      primarySelector: rich.selector ?? null,
      primaryRouteUrl: rich.routeUrl ?? null,
      primaryActionName: rich.actionName ?? null,
      primaryErrorCode: err,
    };
  }

  if (action && loc) {
    return {
      matchBasis: "action_locator",
      signaturePayload: `${action}\0${loc}`,
      primaryAssertionType: assertion || null,
      primaryLocator: rich.locator ?? null,
      primarySelector: null,
      primaryRouteUrl: rich.routeUrl ?? null,
      primaryActionName: action,
      primaryErrorCode: err || null,
    };
  }

  if (isMeaningfulMessageHead(head) && loc) {
    return {
      matchBasis: "message_locator",
      signaturePayload: `${head}\0${loc}`,
      primaryAssertionType: assertion || null,
      primaryLocator: rich.locator ?? null,
      primarySelector: rich.selector ?? null,
      primaryRouteUrl: rich.routeUrl ?? null,
      primaryActionName: action || null,
      primaryErrorCode: err || null,
    };
  }

  if (isMeaningfulMessageHead(head) && route) {
    return {
      matchBasis: "message_route",
      signaturePayload: `${head}\0${route}`,
      primaryAssertionType: assertion || null,
      primaryLocator: rich.locator ?? null,
      primarySelector: rich.selector ?? null,
      primaryRouteUrl: rich.routeUrl ?? null,
      primaryActionName: action || null,
      primaryErrorCode: err || null,
    };
  }

  if (stem && assertion && head.length >= 8) {
    return {
      matchBasis: "fallback_file_assertion",
      signaturePayload: `${stem}\0${assertion}\0${head.slice(0, 48)}`,
      primaryAssertionType: assertion,
      primaryLocator: rich.locator ?? null,
      primarySelector: rich.selector ?? null,
      primaryRouteUrl: rich.routeUrl ?? null,
      primaryActionName: action || null,
      primaryErrorCode: err || null,
    };
  }

  return null;
}

/** Canonical string fed into SHA-256 in the API when persisting `familyKey`. */
export function buildFailureFamilyKeyMaterial(
  selected: SelectedFailureFamilySignature,
  version: string = SYSTEM_TEST_FAILURE_FAMILY_VERSION,
): string {
  return `${version}\0${selected.matchBasis}\0${selected.signaturePayload}`;
}

/** Compact operator title (deterministic template). */
export function buildFamilyDisplayTitle(selected: SelectedFailureFamilySignature): string {
  const a = selected.primaryAssertionType;
  const loc =
    selected.primaryLocator?.trim() ||
    selected.primarySelector?.trim() ||
    "";
  const route = selected.primaryRouteUrl?.trim() ?? "";
  const action = selected.primaryActionName ?? "";
  const err = selected.primaryErrorCode ?? "";

  switch (selected.matchBasis) {
    case "assertion_locator":
    case "assertion_selector":
      return a && loc ?
          `Repeated ${a} failure targeting ${loc.slice(0, 120)}${loc.length > 120 ? "…" : ""}`
        : `Assertion family (${selected.matchBasis})`;
    case "assertion_route":
      return a && route ?
          `Repeated ${a} on route ${route.slice(0, 100)}`
        : `Assertion route family`;
    case "route_error":
      return err && route ? `API/route error ${err} on ${route.slice(0, 100)}` : `Route error family`;
    case "action_locator":
      return action && loc ? `${action} failure on ${loc.slice(0, 100)}` : `Action/locator family`;
    case "message_locator":
      return loc ? `Failure cluster around locator ${loc.slice(0, 100)}` : `Message/locator family`;
    case "message_route":
      return route ? `Failure cluster on route ${route.slice(0, 100)}` : `Message/route family`;
    case "fallback_file_assertion":
      return a ? `File-scoped ${a} pattern` : `File/assertion fallback family`;
    default:
      return "Failure family";
  }
}

export function buildFamilyRootCauseSummary(selected: SelectedFailureFamilySignature): string {
  const title = buildFamilyDisplayTitle(selected);
  const basis = selected.matchBasis.replace(/_/g, " ");
  return `${title} (grouped by ${basis}).`;
}

export type FamilyTrendComputationInput = {
  /** Newest-first run IDs (global recent ordering). */
  recentRunIdsNewestFirst: string[];
  /** For each run ID in the window, total occurrences attributed to this family in that run. */
  occurrencesByRunId: Map<string, number>;
  /** Window size for "seen in X of last Y". */
  windowSize?: number;
};

export function countFamilyPresenceInWindow(
  input: FamilyTrendComputationInput,
): { seenRuns: number; windowRuns: number; totalOccurrencesInWindow: number } {
  const windowSize = input.windowSize ?? 8;
  const window = input.recentRunIdsNewestFirst.slice(0, windowSize);
  let seenRuns = 0;
  let totalOccurrencesInWindow = 0;
  for (const rid of window) {
    const n = input.occurrencesByRunId.get(rid) ?? 0;
    if (n > 0) seenRuns += 1;
    totalOccurrencesInWindow += n;
  }
  return { seenRuns, windowRuns: window.length, totalOccurrencesInWindow };
}

export function computeFamilyTrendKind(
  input: FamilyTrendComputationInput,
): FailureFamilyTrendKind {
  const window = input.recentRunIdsNewestFirst.slice(0, 8);
  if (window.length < 4) return "stable";

  const occ = (i: number) => input.occurrencesByRunId.get(window[i]!) ?? 0;

  const last2 = occ(0) + occ(1);
  const prev2 = occ(2) + occ(3);
  const midGap = occ(2) === 0 && occ(3) === 0 && occ(4) === 0;
  const recentBack = occ(0) > 0 || occ(1) > 0;

  if (midGap && recentBack && occ(0) + occ(1) > 0) {
    return "reactivated";
  }

  if (last2 > prev2 + 1) return "worsening";
  if (prev2 > last2 + 1 && last2 < prev2) return "improving";
  return "stable";
}

export type FamilyStatusComputationInput = {
  recentRunIdsNewestFirst: string[];
  lastSeenRunId: string | null;
};

/**
 * active: last seen in newest 3 runs
 * resolved_candidate: not in newest 5 but lastSeen set
 * quiet: otherwise
 */
export function computeFamilyStatus(
  input: FamilyStatusComputationInput,
): FailureFamilyStatusKind {
  const { recentRunIdsNewestFirst, lastSeenRunId } = input;
  if (!lastSeenRunId) return "quiet";

  const top3 = new Set(recentRunIdsNewestFirst.slice(0, 3));
  if (top3.has(lastSeenRunId)) return "active";

  const top5 = new Set(recentRunIdsNewestFirst.slice(0, 5));
  if (!top5.has(lastSeenRunId)) return "resolved_candidate";

  return "quiet";
}

export function formatFamilyRecurrenceLine(
  seenInWindow: number,
  windowRuns: number,
): string {
  return `Seen in ${seenInWindow} of last ${windowRuns} runs`;
}
