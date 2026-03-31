import {
  normalizeSystemTestFamilyOperatorState,
  operatorStateSortRank,
  toSystemTestFamilyOperatorStateDto,
} from "../src/modules/system-tests/system-test-family-operator-state";
import { parseShowDismissedParam } from "../src/modules/system-tests/system-test-resolution-preview-filters";

describe("system-test-family-operator-state", () => {
  it("normalizes unknown values to open", () => {
    expect(normalizeSystemTestFamilyOperatorState(null)).toBe("open");
    expect(normalizeSystemTestFamilyOperatorState("")).toBe("open");
    expect(normalizeSystemTestFamilyOperatorState("nope")).toBe("open");
  });

  it("maps prisma-shaped source to DTO", () => {
    const dto = toSystemTestFamilyOperatorStateDto({
      operatorState: "acknowledged",
      operatorStateUpdatedAt: new Date("2024-01-02T00:00:00.000Z"),
      operatorStateUpdatedById: "u1",
      operatorStateNote: "note",
    });
    expect(dto.state).toBe("acknowledged");
    expect(dto.updatedAt).toBe("2024-01-02T00:00:00.000Z");
    expect(dto.updatedByUserId).toBe("u1");
    expect(dto.note).toBe("note");
  });

  it("ranks open > acknowledged > dismissed", () => {
    expect(operatorStateSortRank("open")).toBeGreaterThan(operatorStateSortRank("acknowledged"));
    expect(operatorStateSortRank("acknowledged")).toBeGreaterThan(operatorStateSortRank("dismissed"));
  });
});

describe("parseShowDismissedParam", () => {
  it("defaults false", () => {
    expect(parseShowDismissedParam(undefined)).toBe(false);
    expect(parseShowDismissedParam("")).toBe(false);
  });

  it("parses truthy tokens", () => {
    expect(parseShowDismissedParam("true")).toBe(true);
    expect(parseShowDismissedParam("1")).toBe(true);
    expect(parseShowDismissedParam("YES")).toBe(true);
  });
});
