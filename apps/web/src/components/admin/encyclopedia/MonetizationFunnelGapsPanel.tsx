"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { MonetizationGapResolutionFeedback } from "@/components/public/MonetizationGapResolutionFeedback";
import { formatFunnelGapLines } from "@/lib/funnel/funnelGapAudit";
import type { FunnelGap } from "@/lib/funnel/funnelGapReport";
import { warnMonetizationExpansionGaps } from "@/lib/funnel/funnelGapExpansion";
import {
  clearAllMonetizationGapLocalState,
  dismissMonetizationGapInAdmin,
  loadAllGapResolutionFeedback,
  loadDismissedMonetizationGapSlugs,
  resolveGap,
  type ResolutionAction,
} from "@/lib/funnel/funnelGapResolution";

type Props = {
  monetizationGaps: FunnelGap[];
  monetizationGapLines: string[];
};

function actionLabel(action: ResolutionAction): string {
  switch (action) {
    case "acknowledge":
      return "Acknowledged";
    case "resolve":
      return "Resolved";
    case "suppress":
      return "Suppressed";
    default:
      return action;
  }
}

export default function MonetizationFunnelGapsPanel({
  monetizationGaps,
  monetizationGapLines,
}: Props) {
  const [dismissedSlugs, setDismissedSlugs] = useState<Set<string>>(() => new Set());
  const [feedbackTick, setFeedbackTick] = useState(0);

  useEffect(() => {
    setDismissedSlugs(loadDismissedMonetizationGapSlugs());
  }, []);

  const refreshLocal = useCallback(() => {
    setDismissedSlugs(loadDismissedMonetizationGapSlugs());
    setFeedbackTick((n) => n + 1);
  }, []);

  const visibleGaps = useMemo(
    () => monetizationGaps.filter((g) => !dismissedSlugs.has(g.problemSlug)),
    [monetizationGaps, dismissedSlugs],
  );

  const recentFeedback = useMemo(() => {
    void feedbackTick;
    const all = loadAllGapResolutionFeedback();
    return Object.entries(all)
      .map(([slug, rec]) => ({ slug, ...rec }))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8);
  }, [feedbackTick, dismissedSlugs]);

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
    clearAllMonetizationGapLocalState();
    setDismissedSlugs(new Set());
    setFeedbackTick((n) => n + 1);
  }, []);

  const handleExpansionCheck = useCallback(() => {
    warnMonetizationExpansionGaps();
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
            <button
              type="button"
              className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-50"
              onClick={handleExpansionCheck}
            >
              Run expansion check
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
              className="border-b border-neutral-100 pb-3 last:border-0"
            >
              <div className="mb-2 min-w-0 text-xs text-neutral-700">
                {[gap.problemSlug, gap.code, gap.detail].join(" | ")}
              </div>
              <MonetizationGapResolutionFeedback
                problemSlug={gap.problemSlug}
                gapCode={gap.code}
                variant="admin"
                onAfterAction={refreshLocal}
              />
            </div>
          ))
        : displayLines.slice(0, 10).map((line, i) => (
            <div key={`${i}-${line.slice(0, 48)}`} className="text-xs text-neutral-700">
              {line}
            </div>
          ))}
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-3">
        <div className="mb-1 text-xs font-medium text-neutral-600">Recent gap actions (this browser)</div>
        {recentFeedback.length === 0 ?
          <p className="text-xs text-neutral-400">No recorded notes yet.</p>
        : <ul className="space-y-1 text-xs text-neutral-600">
            {recentFeedback.map((row) => (
              <li key={row.slug}>
                <span className="font-medium text-neutral-800">{row.slug}</span>
                {" — "}
                {actionLabel(row.action)}
                {row.note ? ` — ${row.note}` : ""}
                {row.gapCode ? ` [${row.gapCode}]` : ""}
                <span className="text-neutral-400">
                  {" "}
                  ({new Date(row.at).toLocaleString()})
                </span>
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  );
}
