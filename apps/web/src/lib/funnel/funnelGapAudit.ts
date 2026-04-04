import { buildFunnelGapReport } from "./funnelGapReport";

export function buildFunnelGapAuditLines(): string[] {
  const gaps = buildFunnelGapReport();

  if (gaps.length === 0) {
    return ["OK: no monetization funnel gaps detected."];
  }

  return gaps.map((gap) => {
    return [gap.problemSlug, gap.code, gap.detail].join(" | ");
  });
}

export function buildFunnelGapAuditText(): string {
  return buildFunnelGapAuditLines().join("\n");
}
