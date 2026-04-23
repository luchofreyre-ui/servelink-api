import { describe, expect, it } from "vitest";
import {
  deriveFoOnboardingSectionRows,
  reasonCodesToSectionHintLine,
} from "./foSupplyOnboardingSectionSignals";
import type { FoSupplyReadinessSnapshot } from "../api/types";

function baseReadiness(
  overrides: Partial<FoSupplyReadinessSnapshot> = {},
): FoSupplyReadinessSnapshot {
  return {
    franchiseOwnerId: "fo1",
    displayName: "Test",
    email: "t@test.local",
    status: "paused",
    safetyHold: false,
    opsCategory: "inactive_or_restricted",
    supply: { ok: true, reasons: [] },
    eligibility: { canAcceptBooking: false, reasons: ["FO_NOT_ACTIVE"] },
    configSummary: {
      hasCoordinates: true,
      homeLat: 1,
      homeLng: 2,
      maxTravelMinutes: 60,
      scheduleRowCount: 1,
      matchableServiceTypes: [],
      maxDailyLaborMinutes: 480,
      maxLaborMinutes: 480,
      maxSquareFootage: 3000,
    },
    ...overrides,
  };
}

describe("deriveFoOnboardingSectionRows", () => {
  it("marks activation complete when queue is READY_TO_ACTIVATE", () => {
    const rows = deriveFoOnboardingSectionRows(baseReadiness(), "READY_TO_ACTIVATE");
    const act = rows.find((r) => r.id === "activation");
    expect(act?.signal).toBe("complete");
  });

  it("marks schedule incomplete when no rows", () => {
    const rows = deriveFoOnboardingSectionRows(
      baseReadiness({
        configSummary: {
          hasCoordinates: true,
          homeLat: 1,
          homeLng: 2,
          maxTravelMinutes: 60,
          scheduleRowCount: 0,
          matchableServiceTypes: [],
          maxDailyLaborMinutes: 480,
          maxLaborMinutes: 480,
          maxSquareFootage: 3000,
        },
      }),
      "BLOCKED_CONFIGURATION",
    );
    expect(rows.find((r) => r.id === "schedule")?.signal).toBe("incomplete");
  });
});

describe("reasonCodesToSectionHintLine", () => {
  it("maps known reason codes to section labels", () => {
    const line = reasonCodesToSectionHintLine([
      "FO_MISSING_COORDINATES",
      "FO_NO_SCHEDULING_SOURCE",
    ]);
    expect(line).toContain("Service area");
    expect(line).toContain("Weekly schedule");
  });
});
