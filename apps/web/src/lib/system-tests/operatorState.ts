import type { SystemTestFamilyOperatorState } from "@/types/systemTestResolution";

export function isDismissedOperatorState(
  state: SystemTestFamilyOperatorState | null | undefined,
): boolean {
  return state?.state === "dismissed";
}

export function operatorStateLabel(
  state: SystemTestFamilyOperatorState["state"] | null | undefined,
): string {
  if (state === "acknowledged") return "Acknowledged";
  if (state === "dismissed") return "Dismissed";
  return "Open";
}

/** Backend triage rank: open 3, acknowledged 2, dismissed 1. */
export function operatorStateRank(
  state: SystemTestFamilyOperatorState["state"] | null | undefined,
): number {
  if (state === "open") return 3;
  if (state === "acknowledged") return 2;
  if (state === "dismissed") return 1;
  return 3;
}
