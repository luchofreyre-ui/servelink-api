import type { GapResolutionAuditEntry } from "./funnelGapResolution";
import { buildFunnelGapReport, type FunnelGap } from "./funnelGapReport";

export function formatFunnelGapLines(gaps: FunnelGap[]): string[] {
  if (gaps.length === 0) {
    return ["OK: no monetization funnel gaps detected."];
  }

  return gaps.map((gap) => [gap.problemSlug, gap.code, gap.detail].join(" | "));
}

export function buildFunnelGapAuditLines(): string[] {
  return formatFunnelGapLines(buildFunnelGapReport());
}

export function buildFunnelGapAuditText(): string {
  return buildFunnelGapAuditLines().join("\n");
}

export function formatGapResolutionAuditLines(entries: GapResolutionAuditEntry[]): string[] {
  if (entries.length === 0) {
    return ["No gap resolution actions recorded in this browser yet."];
  }
  return entries.map((e) => {
    const parts = [
      e.at,
      e.problemSlug,
      e.action,
      e.gapCode ? `[${e.gapCode}]` : "",
      e.note ? `— ${e.note}` : "",
    ].filter(Boolean);
    return parts.join(" | ");
  });
}
