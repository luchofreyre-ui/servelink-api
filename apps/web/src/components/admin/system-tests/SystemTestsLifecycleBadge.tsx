"use client";

import type { SystemTestFamilyLifecycleState } from "@/types/systemTestResolution";
import { lifecycleStateLabel } from "@/lib/system-tests/lifecycle";

export type SystemTestsLifecycleBadgeProps = {
  state: SystemTestFamilyLifecycleState;
};

export function SystemTestsLifecycleBadge(props: SystemTestsLifecycleBadgeProps) {
  const { state } = props;
  return (
    <span
      data-testid="system-tests-lifecycle-badge"
      className="inline-flex items-center rounded-md border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50"
    >
      {lifecycleStateLabel(state)}
    </span>
  );
}
