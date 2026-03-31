import type { SystemTestFamilyLifecycleState } from "@/types/systemTestResolution";

export function lifecycleStateLabel(state: SystemTestFamilyLifecycleState): string {
  switch (state) {
    case "new":
      return "New";
    case "recurring":
      return "Recurring";
    case "resurfaced":
      return "Resurfaced";
    case "dormant":
      return "Dormant";
    case "resolved":
      return "Resolved";
    default:
      return "Unknown";
  }
}

export function isActiveLifecycleState(state: SystemTestFamilyLifecycleState): boolean {
  return state === "new" || state === "recurring" || state === "resurfaced";
}

/** Backend-style rank: resurfaced highest (5) → resolved lowest (1). */
export function lifecycleStateRank(state: SystemTestFamilyLifecycleState | null | undefined): number {
  if (!state) return 0;
  switch (state) {
    case "resurfaced":
      return 5;
    case "new":
      return 4;
    case "recurring":
      return 3;
    case "dormant":
      return 2;
    case "resolved":
      return 1;
    default:
      return 0;
  }
}
