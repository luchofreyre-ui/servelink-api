import { buildIncidentFixTrack, type IncidentRootCauseCategory } from "./fixTracks.js";
import { normalizeLocatorOrSelector, normalizeRouteUrl } from "./failureFamilies.js";

/** Bump when incident synthesis / clustering rules change. */
export const SYSTEM_TEST_INCIDENT_VERSION = "v1" as const;

export type IncidentMatchBasis =
  | "route_anchor"
  | "locator_anchor"
  | "selector_anchor"
  | "error_route"
  | "action_locator"
  | "surface_plus_current_run"
  | "file_domain_assertion"
  | "title_anchor_overlap"
  | "recent_cooccurrence";

export type IncidentSeverityKind = "critical" | "high" | "medium" | "low";

export type IncidentStatusKind =
  | "active"
  | "monitoring"
  | "quiet"
  | "resolved_candidate";

export type IncidentTrendKind =
  | "worsening"
  | "improving"
  | "stable"
  | "reactivated";

export type IncidentSynthesisFamilyInput = {
  id: string;
  familyKey: string;
  displayTitle: string;
  rootCauseSummary: string;
  primaryRouteUrl: string | null;
  primaryLocator: string | null;
  primarySelector: string | null;
  primaryActionName: string | null;
  primaryErrorCode: string | null;
  primaryAssertionType: string | null;
  affectedRunCount: number;
  affectedFileCount: number;
  totalOccurrencesAcrossRuns: number;
  status: string;
  trendKind: string;
  sampleFiles: string[];
};

export type IncidentFamilyPairEdge = {
  aId: string;
  bId: string;
  bases: IncidentMatchBasis[];
};

export function inferSurfaceAreaFromRoute(routeUrl: string | null | undefined): string {
  const r = normalizeRouteUrl(routeUrl);
  if (!r) return "";
  if (r.includes("/admin")) return "admin";
  if (r.includes("/customer")) return "customer";
  if (r.includes("/fo") || r.includes("/field")) return "fo";
  if (r.includes("/api") || r.startsWith("/api")) return "api";
  return "other";
}

export function inferFileDomainArea(files: string[]): string {
  const blob = files.join("\n").toLowerCase().replace(/\\/g, "/");
  if (blob.includes("/admin/")) return "admin";
  if (blob.includes("/customer/")) return "customer";
  if (blob.includes("/fo/")) return "fo";
  if (blob.includes("api") && (blob.includes("spec") || blob.includes("test")))
    return "api_tests";
  return "";
}

function titleAnchorTokens(title: string, summary: string): Set<string> {
  const raw = `${title} ${summary}`.toLowerCase();
  const parts = raw.split(/[^a-z0-9]+/g).filter((w) => w.length >= 4);
  return new Set(parts);
}

export function titleAnchorOverlapCount(
  a: IncidentSynthesisFamilyInput,
  b: IncidentSynthesisFamilyInput,
): number {
  const ta = titleAnchorTokens(a.displayTitle, a.rootCauseSummary);
  const tb = titleAnchorTokens(b.displayTitle, b.rootCauseSummary);
  let n = 0;
  for (const t of ta) {
    if (tb.has(t)) n += 1;
  }
  return n;
}

/**
 * Deterministic pair link: >=1 strong OR >=2 medium required for an edge.
 * Weak links (broad area only) do not count.
 */
export function evaluateIncidentFamilyPair(
  a: IncidentSynthesisFamilyInput,
  b: IncidentSynthesisFamilyInput,
  coOccurRuns: number,
  bothInCurrentRun: boolean,
): { qualifies: boolean; strong: IncidentMatchBasis[]; medium: IncidentMatchBasis[] } {
  const strong: IncidentMatchBasis[] = [];
  const medium: IncidentMatchBasis[] = [];

  const ra = normalizeRouteUrl(a.primaryRouteUrl);
  const rb = normalizeRouteUrl(b.primaryRouteUrl);
  if (ra && rb && ra === rb) strong.push("route_anchor");

  const la = normalizeLocatorOrSelector(a.primaryLocator || a.primarySelector);
  const lb = normalizeLocatorOrSelector(b.primaryLocator || b.primarySelector);
  if (la && lb && la === lb) strong.push("locator_anchor");

  const sa = normalizeLocatorOrSelector(a.primarySelector);
  const sb = normalizeLocatorOrSelector(b.primarySelector);
  if (sa && sb && sa === sb && sa !== la) strong.push("selector_anchor");

  const ea = (a.primaryErrorCode || "").trim().toLowerCase();
  const eb = (b.primaryErrorCode || "").trim().toLowerCase();
  if (ea && eb && ea === eb && ra && rb && ra === rb) strong.push("error_route");

  const aa = (a.primaryActionName || "").trim().toLowerCase();
  const ab = (b.primaryActionName || "").trim().toLowerCase();
  if (aa && ab && aa === ab && la && lb && la === lb) strong.push("action_locator");

  const surfa = inferSurfaceAreaFromRoute(a.primaryRouteUrl);
  const surfb = inferSurfaceAreaFromRoute(b.primaryRouteUrl);
  if (
    surfa &&
    surfb &&
    surfa === surfb &&
    surfa !== "other" &&
    bothInCurrentRun
  ) {
    strong.push("surface_plus_current_run");
  }

  const da = inferFileDomainArea(a.sampleFiles);
  const db = inferFileDomainArea(b.sampleFiles);
  const asA = (a.primaryAssertionType || "").trim().toLowerCase();
  const asB = (b.primaryAssertionType || "").trim().toLowerCase();
  if (da && db && da === db && asA && asB && asA === asB) {
    medium.push("file_domain_assertion");
  }

  if (titleAnchorOverlapCount(a, b) >= 2) medium.push("title_anchor_overlap");

  if (coOccurRuns >= 2) medium.push("recent_cooccurrence");

  const qualifies = strong.length >= 1 || medium.length >= 2;
  return { qualifies, strong, medium };
}

/**
 * Per-member stable signature (sorted by familyKey). Uses normalized route/locator/error/assertion only.
 */
export function buildIncidentPrimarySignature(
  members: IncidentSynthesisFamilyInput[],
): string {
  const sorted = [...members].sort((a, b) => a.familyKey.localeCompare(b.familyKey));
  const lines = sorted.map((m) => {
    const fk = m.familyKey.trim().toLowerCase();
    const route = normalizeRouteUrl(m.primaryRouteUrl) ?? "";
    const loc = normalizeLocatorOrSelector(m.primaryLocator || m.primarySelector) ?? "";
    const sel = normalizeLocatorOrSelector(m.primarySelector) ?? "";
    const err = (m.primaryErrorCode || "").trim().toLowerCase();
    const asrt = (m.primaryAssertionType || "").trim().toLowerCase();
    const files = [...new Set(m.sampleFiles.map((f) => f.trim().toLowerCase()))].sort((a, b) =>
      a.localeCompare(b),
    );
    const fileBlob = files.join("\x1e");
    return [fk, route, loc, sel, err, asrt, fileBlob].join("\x1f");
  });
  return lines.join("\n");
}

export function buildIncidentSurface(
  lead: IncidentSynthesisFamilyInput,
  members: IncidentSynthesisFamilyInput[],
): string {
  const fromRoute = inferSurfaceAreaFromRoute(lead.primaryRouteUrl).trim().toLowerCase();
  if (fromRoute && fromRoute !== "other") return fromRoute;
  const files = [...members.flatMap((m) => m.sampleFiles)]
    .map((f) => f.trim().toLowerCase())
    .sort((a, b) => a.localeCompare(b));
  const domain = inferFileDomainArea(files).trim().toLowerCase();
  if (domain) return domain;
  return fromRoute || "other";
}

/** Deterministic key material: version + primarySignature + surface + failureType (category). */
export function buildStableIncidentKeyMaterial(input: {
  members: IncidentSynthesisFamilyInput[];
  lead: IncidentSynthesisFamilyInput;
  failureType: IncidentRootCauseCategory;
}): string {
  const primarySignature = buildIncidentPrimarySignature(input.members);
  const surface = buildIncidentSurface(input.lead, input.members);
  const failureType = input.failureType.trim().toLowerCase();
  return `${SYSTEM_TEST_INCIDENT_VERSION}\0${primarySignature}\0${surface}\0${failureType}`;
}

class UnionFind {
  private readonly p = new Map<string, string>();

  find(x: string): string {
    if (!this.p.has(x)) this.p.set(x, x);
    const parent = this.p.get(x)!;
    if (parent !== x) this.p.set(x, this.find(parent));
    return this.p.get(x)!;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    if (ra.localeCompare(rb) < 0) this.p.set(rb, ra);
    else this.p.set(ra, rb);
  }
}

export function clusterFamiliesByIncidentEdges(
  familyIds: string[],
  edges: IncidentFamilyPairEdge[],
): string[][] {
  const uf = new UnionFind();
  for (const id of familyIds) uf.find(id);
  for (const e of edges) {
    uf.union(e.aId, e.bId);
  }
  const buckets = new Map<string, string[]>();
  for (const id of familyIds) {
    const r = uf.find(id);
    if (!buckets.has(r)) buckets.set(r, []);
    buckets.get(r)!.push(id);
  }
  for (const arr of buckets.values()) arr.sort((a, b) => a.localeCompare(b));
  return [...buckets.values()].sort((a, b) => a[0]!.localeCompare(b[0]!));
}

export function aggregateMatchBasisForMember(
  familyId: string,
  componentIds: string[],
  edges: IncidentFamilyPairEdge[],
): string {
  const others = new Set(componentIds.filter((x) => x !== familyId));
  const basis = new Set<IncidentMatchBasis>();
  for (const e of edges) {
    if (
      (e.aId === familyId && others.has(e.bId)) ||
      (e.bId === familyId && others.has(e.aId))
    ) {
      for (const b of e.bases) basis.add(b);
    }
  }
  if (basis.size === 0) return "singleton_component";
  return [...basis].sort((a, b) => a.localeCompare(b)).join("+");
}

export function inferRootCauseCategoryFromFamilies(
  members: IncidentSynthesisFamilyInput[],
  lead: IncidentSynthesisFamilyInput,
): IncidentRootCauseCategory {
  const blob = members
    .map((m) =>
      `${m.displayTitle} ${m.rootCauseSummary} ${m.primaryAssertionType ?? ""}`.toLowerCase(),
    )
    .join(" ");

  if (/session|auth|unauthor|forbidden|401|403/.test(blob)) return "auth_session_state";
  if (/api\/|\/api|route error|status ?5\d{2}/.test(blob) && lead.primaryErrorCode)
    return "api_route_error";
  if (lead.primaryErrorCode && normalizeRouteUrl(lead.primaryRouteUrl))
    return "api_route_error";

  const assert = (lead.primaryAssertionType || "").toLowerCase();
  if (assert.includes("visible") || assert.includes("attached") || /timeout|timed out/.test(blob))
    return "ui_visibility_timeout";
  if (normalizeLocatorOrSelector(lead.primaryLocator || lead.primarySelector))
    return "ui_selector";

  if (/expected|received|tostring|strict equality/.test(blob)) return "assertion_content_mismatch";
  if (/navigation|redirect|404/.test(blob)) return "routing_navigation";
  if (/race|flaky|intermittent|async/.test(blob)) return "timing_async_state";
  if (/seed|fixture|database|db\b/.test(blob)) return "data_fixture_state";

  return "unknown";
}

export function computeIncidentTrendFromMembers(
  trendKinds: string[],
): IncidentTrendKind {
  const set = new Set(trendKinds.map((t) => t.toLowerCase()));
  if (set.has("worsening")) return "worsening";
  if (set.has("reactivated")) return "reactivated";
  if (set.has("improving") && !set.has("worsening") && !set.has("reactivated")) {
    const onlyImproving = trendKinds.every((t) => t === "improving");
    if (onlyImproving && trendKinds.length) return "improving";
  }
  if (set.has("improving")) return "stable";
  return "stable";
}

export function computeIncidentStatus(input: {
  lastSeenRunId: string | null;
  recentRunIdsNewestFirst: string[];
}): IncidentStatusKind {
  const { lastSeenRunId, recentRunIdsNewestFirst } = input;
  if (!lastSeenRunId) return "quiet";

  const newest = recentRunIdsNewestFirst[0];
  if (newest && lastSeenRunId === newest) return "active";

  const top3 = new Set(recentRunIdsNewestFirst.slice(0, 3));
  if (top3.has(lastSeenRunId)) return "monitoring";

  const top5 = new Set(recentRunIdsNewestFirst.slice(0, 5));
  if (top5.has(lastSeenRunId)) return "quiet";

  return "resolved_candidate";
}

export function computeIncidentSeverity(input: {
  status: IncidentStatusKind;
  inLatestRun: boolean;
  currentRunFailureCount: number;
  affectedFamilyCount: number;
  affectedFileCount: number;
  trend: IncidentTrendKind;
  leadBandHigh: boolean;
  category: IncidentRootCauseCategory;
}): IncidentSeverityKind {
  const criticalPath =
    input.category === "api_route_error" || input.category === "auth_session_state";

  if (
    input.inLatestRun &&
    input.currentRunFailureCount >= 8 &&
    input.affectedFileCount >= 4 &&
    (input.trend === "worsening" || input.trend === "reactivated") &&
    criticalPath
  ) {
    return "critical";
  }

  if (
    input.inLatestRun &&
    input.affectedFamilyCount >= 3 &&
    (input.trend === "worsening" || input.trend === "reactivated") &&
    input.leadBandHigh
  ) {
    return "critical";
  }

  if (
    input.inLatestRun &&
    (input.currentRunFailureCount >= 4 || input.affectedFileCount >= 3)
  ) {
    return "high";
  }

  if (input.inLatestRun) return "medium";

  if (input.status === "monitoring") return "medium";
  if (input.status === "resolved_candidate") return "low";
  return "low";
}

export function selectLeadFamilyId(
  members: IncidentSynthesisFamilyInput[],
  currentRunFamilyIds: Set<string>,
): string {
  const score = (m: IncidentSynthesisFamilyInput): number => {
    let s = 0;
    if (currentRunFamilyIds.has(m.id)) s += 100;
    const t = m.trendKind.toLowerCase();
    if (t === "worsening" || t === "reactivated") s += 50;
    else if (t === "stable") s += 20;
    s += Math.min(m.affectedRunCount, 20) * 8;
    s += Math.min(m.affectedFileCount, 20) * 5;
    s += Math.min(m.totalOccurrencesAcrossRuns, 40) * 2;
    if (normalizeLocatorOrSelector(m.primaryLocator || m.primarySelector)) s += 25;
    if (normalizeRouteUrl(m.primaryRouteUrl)) s += 18;
    if ((m.primaryErrorCode || "").trim()) s += 12;
    return s;
  };

  let best = members[0]!;
  let bestScore = score(best);
  for (const m of members.slice(1)) {
    const sc = score(m);
    if (sc > bestScore || (sc === bestScore && m.familyKey.localeCompare(best.familyKey) < 0)) {
      best = m;
      bestScore = sc;
    }
  }
  return best.id;
}

export function inferMemberRole(
  familyId: string,
  leadId: string,
  trendKind: string,
): "lead" | "contributing" | "symptom" {
  if (familyId === leadId) return "lead";
  if (trendKind.toLowerCase() === "improving") return "symptom";
  return "contributing";
}

export function buildIncidentDisplayTitleAndSummary(input: {
  category: IncidentRootCauseCategory;
  lead: IncidentSynthesisFamilyInput;
  memberCount: number;
  affectedFileCount: number;
}): { displayTitle: string; summary: string } {
  const lead = input.lead;
  const route = normalizeRouteUrl(lead.primaryRouteUrl) || "the application";
  const loc =
    lead.primaryLocator?.trim() ||
    lead.primarySelector?.trim() ||
    lead.displayTitle.slice(0, 80);

  let displayTitle = "System test incident";
  switch (input.category) {
    case "ui_visibility_timeout":
      displayTitle = `Visibility/timeout incident around ${loc.slice(0, 72)}${loc.length > 72 ? "…" : ""}`;
      break;
    case "ui_selector":
      displayTitle = `Selector stability incident (${loc.slice(0, 64)}${loc.length > 64 ? "…" : ""})`;
      break;
    case "api_route_error":
      displayTitle = `API/route error incident on ${route.slice(0, 80)}`;
      break;
    case "auth_session_state":
      displayTitle = `Authentication/session state incident (${route.slice(0, 64)})`;
      break;
    case "routing_navigation":
      displayTitle = `Routing/navigation incident (${route.slice(0, 72)})`;
      break;
    case "assertion_content_mismatch":
      displayTitle = `Assertion/content mismatch incident`;
      break;
    case "timing_async_state":
      displayTitle = `Async/timing incident (${route.slice(0, 64)})`;
      break;
    case "data_fixture_state":
      displayTitle = `Test data/fixture incident`;
      break;
    default:
      displayTitle = `Multi-family incident (${input.memberCount} families)`;
  }

  const summary = `${input.memberCount} active famil${input.memberCount === 1 ? "y" : "ies"} across ${input.affectedFileCount} test file${input.affectedFileCount === 1 ? "" : "s"}, centered on ${lead.displayTitle.slice(0, 120)}${lead.displayTitle.length > 120 ? "…" : ""}.`;

  return { displayTitle, summary };
}

export function buildSynthesizedIncidentPayload(input: {
  members: IncidentSynthesisFamilyInput[];
  currentRunFamilyIds: Set<string>;
  edges: IncidentFamilyPairEdge[];
  recentRunIdsNewestFirst: string[];
  /** Latest run any member touched (for status windows). */
  lastSeenRunId: string | null;
  currentRunFailureCount: number;
  affectedRunCount: number;
  affectedFileCount: number;
  leadHighPriorityBand: boolean;
}): {
  incidentKeyMaterial: string;
  sortedFamilyKeys: string[];
  displayTitle: string;
  summary: string;
  rootCauseCategory: IncidentRootCauseCategory;
  severity: IncidentSeverityKind;
  status: IncidentStatusKind;
  trend: IncidentTrendKind;
  leadFamilyId: string;
  fixTrack: ReturnType<typeof buildIncidentFixTrack>;
  memberRoles: Array<{
    familyId: string;
    matchBasis: string;
    role: "lead" | "contributing" | "symptom";
  }>;
} {
  const membersSorted = [...input.members].sort((a, b) =>
    a.familyKey.localeCompare(b.familyKey),
  );
  const leadFamilyId = selectLeadFamilyId(membersSorted, input.currentRunFamilyIds);
  const lead = membersSorted.find((m) => m.id === leadFamilyId)!;

  const category = inferRootCauseCategoryFromFamilies(membersSorted, lead);
  const incidentKeyMaterial = buildStableIncidentKeyMaterial({
    members: membersSorted,
    lead,
    failureType: category,
  });
  const sortedFamilyKeys = membersSorted.map((m) => m.familyKey);

  const trend = computeIncidentTrendFromMembers(membersSorted.map((m) => m.trendKind));

  const memberIdSet = new Set(membersSorted.map((m) => m.id));
  const inLatestRun = [...input.currentRunFamilyIds].some((id) =>
    memberIdSet.has(id),
  );

  const status = computeIncidentStatus({
    lastSeenRunId: input.lastSeenRunId,
    recentRunIdsNewestFirst: input.recentRunIdsNewestFirst,
  });

  const adjustedStatus: IncidentStatusKind = inLatestRun ? "active" : status;

  const severity = computeIncidentSeverity({
    status: adjustedStatus,
    inLatestRun,
    currentRunFailureCount: input.currentRunFailureCount,
    affectedFamilyCount: membersSorted.length,
    affectedFileCount: input.affectedFileCount,
    trend,
    leadBandHigh: input.leadHighPriorityBand,
    category,
  });

  const { displayTitle, summary } = buildIncidentDisplayTitleAndSummary({
    category,
    lead,
    memberCount: membersSorted.length,
    affectedFileCount: input.affectedFileCount,
  });

  const repFiles = membersSorted.flatMap((m) => m.sampleFiles);
  const leadId = lead.id;

  const fixTrack = buildIncidentFixTrack({
    category,
    leadFamilyKey: lead.familyKey,
    primaryRoute: lead.primaryRouteUrl,
    primaryLocator: lead.primaryLocator,
    primarySelector: lead.primarySelector,
    primaryErrorCode: lead.primaryErrorCode,
    representativeFiles: repFiles,
    memberFamilyKeys: membersSorted.map((m) => m.familyKey),
  });

  const componentIds = membersSorted.map((m) => m.id);
  const memberRoles = membersSorted.map((m) => ({
    familyId: m.id,
    matchBasis: aggregateMatchBasisForMember(m.id, componentIds, input.edges),
    role: inferMemberRole(m.id, leadId, m.trendKind),
  }));

  return {
    incidentKeyMaterial,
    sortedFamilyKeys,
    displayTitle,
    summary,
    rootCauseCategory: category,
    severity,
    status: adjustedStatus,
    trend,
    leadFamilyId: leadId,
    fixTrack,
    memberRoles,
  };
}
