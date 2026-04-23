import { evaluateFoSupplyReadiness } from "../src/modules/fo/fo-supply-readiness";

describe("evaluateFoSupplyReadiness", () => {
  const base = () => ({
    homeLat: 36.15 as number | null,
    homeLng: -95.99 as number | null,
    maxTravelMinutes: 60 as number | null,
    maxDailyLaborMinutes: 960 as number | null,
    maxLaborMinutes: 960 as number | null,
    maxSquareFootage: 5000 as number | null,
    scheduleRowCount: 7,
  });

  it("passes for complete primitives + schedule", () => {
    const r = evaluateFoSupplyReadiness(base());
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it("FO_MISSING_COORDINATES when lat null", () => {
    const r = evaluateFoSupplyReadiness({ ...base(), homeLat: null });
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("FO_MISSING_COORDINATES");
  });

  it("FO_INVALID_COORDINATES for out-of-range lat", () => {
    const r = evaluateFoSupplyReadiness({ ...base(), homeLat: 200 });
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("FO_INVALID_COORDINATES");
  });

  it("FO_INVALID_TRAVEL_CONSTRAINT for maxTravelMinutes 0", () => {
    const r = evaluateFoSupplyReadiness({ ...base(), maxTravelMinutes: 0 });
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("FO_INVALID_TRAVEL_CONSTRAINT");
  });

  it("FO_NO_SCHEDULING_SOURCE when no schedule rows", () => {
    const r = evaluateFoSupplyReadiness({ ...base(), scheduleRowCount: 0 });
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("FO_NO_SCHEDULING_SOURCE");
  });

  it("FO_INVALID_CAPACITY_CONFIG for non-null bad daily cap", () => {
    const r = evaluateFoSupplyReadiness({ ...base(), maxDailyLaborMinutes: 0 });
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain("FO_INVALID_CAPACITY_CONFIG");
  });

  it("allows null maxDailyLaborMinutes (no daily cap)", () => {
    const r = evaluateFoSupplyReadiness({ ...base(), maxDailyLaborMinutes: null });
    expect(r.ok).toBe(true);
  });
});
