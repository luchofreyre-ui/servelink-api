"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { formatFunnelGapLines } from "@/lib/funnel/funnelGapAudit";
import type { FunnelGap } from "@/lib/funnel/funnelGapReport";
import {
  clearDismissedMonetizationGapsInAdmin,
  dismissMonetizationGapInAdmin,
  loadDismissedMonetizationGapSlugs,
  resolveGap,
  type ResolutionAction,
} from "@/lib/funnel/funnelGapResolution";

type Props = {
  monetizationGaps: FunnelGap[];
  monetizationGapLines: string[];
};

export default function MonetizationFunnelGapsPanel({
  monetizationGaps,
  monetizationGapLines,
}: Props) {
  const [dismissedSlugs, setDismissedSlugs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setDismissedSlugs(loadDismissedMonetizationGapSlugs());
  }, []);

  const visibleGaps = useMemo(
    () => monetizationGaps.filter((g) => !dismissedSlugs.has(g.problemSlug)),
    [monetizationGaps, dismissedSlugs],
  );

  const displayLines = useMemo(() => {
    if (monetizationGaps.length === 0) {
      return monetizationGapLines.length ? monetizationGapLines : formatFunnelGapLines([]);
    }
    if (visibleGaps.length === 0) {
      return [
        "All current gaps are dismissed in this browser (local only). Use “Reset dismissed” to show them again.",
      ];
    }
    return formatFunnelGapLines(visibleGaps);
  }, [monetizationGaps.length, monetizationGapLines, visibleGaps]);

  const handleAction = useCallback((problemSlug: string, action: ResolutionAction) => {
    resolveGap(problemSlug, action);
    dismissMonetizationGapInAdmin(problemSlug);
    setDismissedSlugs(loadDismissedMonetizationGapSlugs());
  }, []);

  const handleBulk = useCallback(
    (action: ResolutionAction) => {
      const slugs = [...new Set(monetizationGaps.map((g) => g.problemSlug))];
      for (const slug of slugs) {
        resolveGap(slug, action);
        dismissMonetizationGapInAdmin(slug);
      }
      setDismissedSlugs(loadDismissedMonetizationGapSlugs());
    },
    [monetizationGaps],
  );

  const handleResetDismissed = useCallback(() => {
    clearDismissedMonetizationGapsInAdmin();
    setDismissedSlugs(new Set());
  }, []);

  const countLabel =
    monetizationGaps.length === 0
      ? "No monetization gaps detected across the tracked execution-first hubs."
      : visibleGaps.length === 0
        ? `${monetizationGaps.length} gap(s) on server — all dismissed locally.`
        : `${visibleGaps.length} gap(s) detected across tracked hubs.`;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">Monetization funnel gaps</div>
        {monetizationGaps.length > 0 ?
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              onClick={() => handleBulk("acknowledge")}
            >
              Acknowledge all
            </button>
            <button
              type="button"
              className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              onClick={() => handleBulk("resolve")}
            >
              Resolve all
            </button>
            <button
              type="button"
              className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              onClick={() => handleBulk("suppress")}
            >
              Suppress all
            </button>
            <button
              type="button"
              className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-50"
              onClick={handleResetDismissed}
            >
              Reset dismissed
            </button>
          </div>
        : null}
      </div>

      <div className="mb-3 text-xs text-neutral-500">{countLabel}</div>

      <div className="space-y-3">
        {visibleGaps.length > 0 ?
          visibleGaps.slice(0, 10).map((gap) => (
            <div
              key={`${gap.problemSlug}-${gap.code}`}
              className="flex flex-col gap-2 border-b border-neutral-100 pb-2 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 text-xs text-neutral-700">
                {[gap.problemSlug, gap.code, gap.detail].join(" | ")}
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                <button
                  type="button"
                  className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                  onClick={() => handleAction(gap.problemSlug, "acknowledge")}
                >
                  Acknowledge
                </button>
                <button
                  type="button"
                  className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                  onClick={() => handleAction(gap.problemSlug, "resolve")}
                >
                  Resolve
                </button>
                <button
                  type="button"
                  className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                  onClick={() => handleAction(gap.problemSlug, "suppress")}
                >
                  Suppress
                </button>
              </div>
            </div>
          ))
        : displayLines.slice(0, 10).map((line, i) => (
            <div key={`${i}-${line.slice(0, 48)}`} className="text-xs text-neutral-700">
              {line}
            </div>
          ))}
      </div>
    </div>
  );
}
