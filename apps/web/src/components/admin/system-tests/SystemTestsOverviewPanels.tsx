"use client";

import type { ComponentProps } from "react";
import type {
  SystemTestFamilyOperatorState,
  SystemTestFixOpportunity,
} from "@/types/systemTestResolution";
import type { SystemTestsTopProblemItem } from "@/types/systemTests";
import { SystemTestsFixOpportunityStrip } from "./SystemTestsFixOpportunityStrip";
import { SystemTestsLatestFailuresPanel } from "./SystemTestsLatestFailuresPanel";
import { SystemTestsTopIssuesPanel } from "./SystemTestsTopIssuesPanel";

export type SystemTestsLatestFailuresPanelProps = ComponentProps<typeof SystemTestsLatestFailuresPanel>;

export type SystemTestsOverviewPanelsProps = {
  fixOpportunities: SystemTestFixOpportunity[];
  topProblems: SystemTestsTopProblemItem[];
  topIssuesLoading?: boolean;
  latestFailures: SystemTestsLatestFailuresPanelProps;
  showDismissed?: boolean;
  onShowDismissedChange?: (value: boolean) => void;
  includeDormant?: boolean;
  onIncludeDormantChange?: (value: boolean) => void;
  includeResolved?: boolean;
  onIncludeResolvedChange?: (value: boolean) => void;
  onFixOpportunityOperatorStateUpdated?: (updated: SystemTestFixOpportunity) => void;
  onFamilyBackedTopIssueOperatorStateUpdated?: (
    familyId: string,
    next: SystemTestFamilyOperatorState,
  ) => void;
};

/**
 * Dashboard block: fix-opportunity strip, top issues, latest failure digest (Phase 10C).
 */
export function SystemTestsOverviewPanels(props: SystemTestsOverviewPanelsProps) {
  const {
    fixOpportunities,
    topProblems,
    topIssuesLoading,
    latestFailures,
    showDismissed = false,
    onShowDismissedChange,
    includeDormant = true,
    onIncludeDormantChange,
    includeResolved = false,
    onIncludeResolvedChange,
    onFixOpportunityOperatorStateUpdated,
    onFamilyBackedTopIssueOperatorStateUpdated,
  } = props;

  return (
    <div className="space-y-8" data-testid="system-tests-overview-panels">
      <div className="flex flex-wrap gap-4 text-sm text-white/65">
        {onShowDismissedChange ?
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-white/20 bg-white/10"
              checked={showDismissed}
              onChange={(e) => onShowDismissedChange(e.target.checked)}
              data-testid="system-tests-show-dismissed-toggle"
            />
            Show dismissed
          </label>
        : null}
        {onIncludeDormantChange ?
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-white/20 bg-white/10"
              checked={includeDormant}
              onChange={(e) => onIncludeDormantChange(e.target.checked)}
              data-testid="system-tests-include-dormant-toggle"
            />
            Include dormant
          </label>
        : null}
        {onIncludeResolvedChange ?
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-white/20 bg-white/10"
              checked={includeResolved}
              onChange={(e) => onIncludeResolvedChange(e.target.checked)}
              data-testid="system-tests-include-resolved-toggle"
            />
            Include resolved
          </label>
        : null}
      </div>

      {fixOpportunities.length > 0 ? (
        <section className="space-y-2" data-testid="system-tests-fix-opportunities-section">
          <div>
            <h2 className="text-lg font-semibold text-white">Highest-confidence fix opportunities</h2>
            <p className="mt-1 text-sm text-white/55">
              Most actionable family-level fixes based on diagnosis confidence and impact.
            </p>
          </div>
          <SystemTestsFixOpportunityStrip
            items={fixOpportunities}
            onFixOpportunityOperatorStateUpdated={onFixOpportunityOperatorStateUpdated}
          />
        </section>
      ) : null}

      <SystemTestsTopIssuesPanel
        items={topProblems}
        loading={topIssuesLoading}
        onFamilyBackedOperatorStateUpdated={onFamilyBackedTopIssueOperatorStateUpdated}
      />

      <SystemTestsLatestFailuresPanel {...latestFailures} />
    </div>
  );
}
