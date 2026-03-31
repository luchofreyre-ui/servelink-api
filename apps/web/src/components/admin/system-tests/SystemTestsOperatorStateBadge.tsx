"use client";

import { operatorStateLabel } from "@/lib/system-tests/operatorState";
import { SystemTestsBadge, type SystemTestsBadgeVariant } from "./SystemTestsBadge";

export type SystemTestsOperatorStateBadgeProps = {
  state: "open" | "acknowledged" | "dismissed";
};

function variantForState(state: SystemTestsOperatorStateBadgeProps["state"]): SystemTestsBadgeVariant {
  if (state === "acknowledged") return "warning";
  if (state === "dismissed") return "stable";
  return "stable";
}

export function SystemTestsOperatorStateBadge(props: SystemTestsOperatorStateBadgeProps) {
  const { state } = props;
  const muted = state === "dismissed";
  return (
    <span data-testid="system-tests-operator-state-badge">
      <SystemTestsBadge
        variant={variantForState(state)}
        className={muted ? "!normal-case !text-white/50 !ring-white/15" : "!normal-case"}
      >
        {operatorStateLabel(state)}
      </SystemTestsBadge>
    </span>
  );
}
