"use client";

import { MonetizationGapResolutionFeedback } from "./MonetizationGapResolutionFeedback";

type Props = {
  problemSlug: string;
};

export function MonetizationGapResolution({ problemSlug }: Props) {
  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3">
      <div className="text-xs font-medium text-neutral-800">Record a view on this gap</div>
      <p className="text-xs text-neutral-500">
        Stored in this browser only (same as admin dismissals). Does not change server-side catalog data.
      </p>
      <MonetizationGapResolutionFeedback problemSlug={problemSlug} variant="public" />
    </div>
  );
}
