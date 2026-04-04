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
