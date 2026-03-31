export type SystemTestFamilyOperatorStateValue =
  | "open"
  | "acknowledged"
  | "dismissed";

export type SystemTestFamilyOperatorStateDto = {
  state: SystemTestFamilyOperatorStateValue;
  updatedAt: string | null;
  updatedByUserId: string | null;
  note: string | null;
};

type OperatorStateSource = {
  operatorState?: string | null;
  operatorStateUpdatedAt?: Date | string | null;
  operatorStateUpdatedById?: string | null;
  operatorStateNote?: string | null;
};

export function normalizeSystemTestFamilyOperatorState(
  value: string | null | undefined,
): SystemTestFamilyOperatorStateValue {
  if (
    value === "acknowledged" ||
    value === "dismissed" ||
    value === "open"
  ) {
    return value;
  }

  return "open";
}

export function toSystemTestFamilyOperatorStateDto(
  source: OperatorStateSource | null | undefined,
): SystemTestFamilyOperatorStateDto {
  const updatedAtValue = source?.operatorStateUpdatedAt;
  return {
    state: normalizeSystemTestFamilyOperatorState(source?.operatorState),
    updatedAt:
      updatedAtValue instanceof Date
        ? updatedAtValue.toISOString()
        : typeof updatedAtValue === "string"
          ? updatedAtValue
          : null,
    updatedByUserId: source?.operatorStateUpdatedById ?? null,
    note: source?.operatorStateNote ?? null,
  };
}

/** open first (3), acknowledged (2), dismissed last (1). */
export function operatorStateSortRank(
  state: SystemTestFamilyOperatorStateValue | null | undefined,
): number {
  const s = state ?? "open";
  if (s === "open") return 3;
  if (s === "acknowledged") return 2;
  return 1;
}
