"use client";

import Link from "next/link";
import type { SystemTestFixOpportunity } from "@/types/systemTestResolution";
import { fixOpportunityToResolutionPreview } from "@/lib/system-tests/fixOpportunityPreview";
import { buildFixOpportunityQuickFixText } from "@/lib/system-tests/quickFixCopy";
import { getResolutionPreviewSummary } from "./SystemTestsResolutionPreview";
import { SystemTestsBadge } from "./SystemTestsBadge";
import { SystemTestsCopyQuickFixButton } from "./SystemTestsCopyQuickFixButton";
import { SystemTestsOperatorStateActions } from "./SystemTestsOperatorStateActions";
import { SystemTestsOperatorStateBadge } from "./SystemTestsOperatorStateBadge";
import { SystemTestsLifecycleBadge } from "./SystemTestsLifecycleBadge";

export type SystemTestsFixOpportunityStripProps = {
  items: SystemTestFixOpportunity[];
  onFixOpportunityOperatorStateUpdated?: (updated: SystemTestFixOpportunity) => void;
};

function formatCategoryLabel(category: string | null): string | null {
  if (!category) return null;
  return category.replace(/_/g, " ");
}

export function SystemTestsFixOpportunityStrip(props: SystemTestsFixOpportunityStripProps) {
  const { items, onFixOpportunityOperatorStateUpdated } = props;

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      data-testid="system-tests-fix-opportunity-strip"
    >
      {items.map((item) => {
        const preview = fixOpportunityToResolutionPreview(item);
        const summary = getResolutionPreviewSummary(preview);
        return (
          <div
            key={item.familyId}
            className="flex min-w-0 flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
            data-testid="system-tests-fix-opportunity-card"
          >
            <p className="line-clamp-2 text-sm font-medium leading-snug text-white">{item.title}</p>
            <div className="flex flex-wrap gap-1">
              <SystemTestsLifecycleBadge state={item.lifecycle.lifecycleState} />
              <SystemTestsOperatorStateBadge state={item.operatorState.state} />
              {formatCategoryLabel(item.category) ? (
                <SystemTestsBadge variant="stable" className="!normal-case">
                  {formatCategoryLabel(item.category)}
                </SystemTestsBadge>
              ) : null}
              {item.confidenceLabel ? (
                <SystemTestsBadge variant="stable" className="!normal-case">
                  {item.confidenceLabel}
                </SystemTestsBadge>
              ) : null}
            </div>
            {summary ? (
              <p className="line-clamp-2 text-[11px] leading-snug text-white/70">{summary}</p>
            ) : null}
            <p className="text-[10px] text-white/45">
              {item.failureCount} failure{item.failureCount !== 1 ? "s" : ""}
              {" · "}
              {item.affectedRunCount} run{item.affectedRunCount !== 1 ? "s" : ""}
            </p>
            <div className="mt-auto flex flex-col gap-1.5">
              <SystemTestsOperatorStateActions
                familyId={item.familyId}
                currentState={item.operatorState.state}
                compact
                onUpdated={(next) => {
                  const updated = { ...item, operatorState: next, lifecycle: item.lifecycle };
                  onFixOpportunityOperatorStateUpdated?.(updated);
                }}
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <SystemTestsCopyQuickFixButton
                  text={buildFixOpportunityQuickFixText(item, preview)}
                  className="text-xs"
                />
                <Link
                  href={`/admin/system-tests/families/${item.familyId}`}
                  className="text-xs font-medium text-sky-300 hover:text-sky-200"
                  data-testid="system-tests-fix-opportunity-link"
                >
                  View fix
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
