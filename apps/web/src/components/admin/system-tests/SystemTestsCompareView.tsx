"use client";

import { useCallback, useState } from "react";
import type { SystemTestsCompareIntelligence, SystemTestsCompareResult } from "@/types/systemTests";
import { SystemTestsCompareCaseGroups } from "./SystemTestsCompareCaseGroups";
import { SystemTestsCompareIntelligencePanel } from "./SystemTestsCompareIntelligencePanel";
import { SystemTestsCompareSummary } from "./SystemTestsCompareSummary";

type Props = {
  compare: SystemTestsCompareResult;
  /** JSON string (enriched export for AI / operators). */
  payload: string;
  intelligence: SystemTestsCompareIntelligence;
};

export function SystemTestsCompareView(props: Props) {
  const { compare, payload, intelligence } = props;
  const [copied, setCopied] = useState(false);

  const copyPayload = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [payload]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Compare runs</h1>
        <button
          type="button"
          onClick={() => void copyPayload()}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
        >
          {copied ? "Copied" : "Copy compare payload"}
        </button>
      </div>

      <SystemTestsCompareSummary compare={compare} />

      <SystemTestsCompareIntelligencePanel intelligence={intelligence} />

      <SystemTestsCompareCaseGroups
        title="New failures"
        variant="new"
        groups={compare.newFailures}
      />
      <SystemTestsCompareCaseGroups
        title="Resolved failures"
        variant="resolved"
        groups={compare.resolvedFailures}
      />
      <SystemTestsCompareCaseGroups
        title="Still failing"
        variant="persistent"
        groups={compare.stillFailing}
      />
      <SystemTestsCompareCaseGroups
        title="New flaky"
        variant="flaky"
        groups={compare.newFlaky}
      />
      <SystemTestsCompareCaseGroups
        title="Resolved flaky"
        variant="resolved"
        groups={compare.resolvedFlaky}
      />
    </div>
  );
}
