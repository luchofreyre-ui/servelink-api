import { describe, expect, it } from "vitest";
import {
  buildGovernanceHistoryExportRows,
  flattenEstimatorConfigForExport,
} from "./deepCleanEstimatorGovernanceExport";

describe("deepCleanEstimatorGovernanceExport", () => {
  it("builds history rows", () => {
    const { headers, rows } = buildGovernanceHistoryExportRows([
      {
        id: "i1",
        version: 2,
        status: "active",
        label: "L",
        publishedAt: "2020-01-01T00:00:00.000Z",
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-02T00:00:00.000Z",
        createdByUserId: null,
        publishedByUserId: null,
      },
    ]);
    expect(headers[1]).toBe("version");
    expect(rows[0]?.[1]).toBe("2");
  });

  it("flattens config", () => {
    const flat = flattenEstimatorConfigForExport({
      globalDurationMultiplier: 1,
      singleVisitDurationMultiplier: 1,
      threeVisitDurationMultiplier: 1,
      visitDurationMultipliers: { visit1: 1, visit2: 1, visit3: 1 },
      bedroomAdditiveMinutes: 0,
      bathroomAdditiveMinutes: 0,
      petAdditiveMinutes: 0,
      kitchenHeavySoilAdditiveMinutes: 0,
      minimumVisitDurationMinutes: 0,
      minimumProgramDurationMinutes: 0,
    });
    expect(flat.globalDurationMultiplier).toBe("1");
  });
});
