"use client";

import { useState } from "react";

import {
  dismissMonetizationGapInAdmin,
  resolveGap,
  type ResolutionAction,
} from "@/lib/funnel/funnelGapResolution";

type Props = {
  problemSlug: string;
};

export function MonetizationGapResolution({ problemSlug }: Props) {
  const [action, setAction] = useState<ResolutionAction | null>(null);

  const handleResolution = (next: ResolutionAction) => {
    setAction(next);
    resolveGap(problemSlug, next);
    dismissMonetizationGapInAdmin(problemSlug);
  };

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3">
      <div className="text-xs font-medium text-neutral-800">Record a view on this gap</div>
      <p className="text-xs text-neutral-500">
        Stored in this browser only (same as admin dismissals). Does not change server-side catalog data.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
          onClick={() => handleResolution("resolve")}
          disabled={action === "resolve"}
        >
          Resolve
        </button>
        <button
          type="button"
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
          onClick={() => handleResolution("acknowledge")}
          disabled={action === "acknowledge"}
        >
          Acknowledge
        </button>
        <button
          type="button"
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
          onClick={() => handleResolution("suppress")}
          disabled={action === "suppress"}
        >
          Suppress
        </button>
      </div>
    </div>
  );
}
