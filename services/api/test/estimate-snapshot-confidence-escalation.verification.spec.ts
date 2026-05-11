import { EstimatorService, type EstimateInput } from "../src/modules/estimate/estimator.service";
import { EstimateEngineV2Service } from "../src/modules/estimate/estimate-engine-v2.service";
import { EstimateLearningService } from "../src/modules/estimate/estimate-learning.service";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import {
  getEscalationSummary,
  getTopUncertaintyDrivers,
  getWeakestConfidenceDomains,
  readGovernanceLevelFromSnapshotOutputJson,
  tryParseEstimateSnapshotOutputJson,
  tryReadConfidenceBreakdownFromSnapshotOutput,
  tryReadEscalationGovernanceFromSnapshotOutput,
} from "../src/modules/estimate/estimate-snapshot-metadata.read";
import type { FoService } from "../src/modules/fo/fo.service";
import type { DeepCleanEstimatorConfigService } from "../src/modules/bookings/deep-clean-estimator-config.service";

const mockFoService = {
  matchFOs: jest.fn().mockResolvedValue([]),
} as unknown as FoService;

const mockDeepCleanEstimatorConfig = {
  getActiveForEstimate: jest.fn().mockResolvedValue(null),
} as unknown as DeepCleanEstimatorConfigService;

function baseEstimateInput(): EstimateInput {
  return {
    property_type: "house",
    sqft_band: "1600_1999",
    bedrooms: "3",
    bathrooms: "2",
    floors: "2",
    service_type: "maintenance",
    first_time_with_servelink: "no",
    last_professional_clean: "1_3_months",
    clutter_level: "light",
    kitchen_condition: "normal",
    stovetop_type: "flat_glass",
    bathroom_condition: "normal",
    glass_showers: "none",
    pet_presence: "none",
    occupancy_state: "occupied_normal",
    floor_visibility: "mostly_clear",
    carpet_percent: "0_25",
    stairs_flights: "one",
    addons: [],
    overall_labor_condition: "normal_lived_in",
    kitchen_intensity: "average_use",
    clutter_access: "mostly_clear",
    pet_impact: "none",
    last_pro_clean_recency: "within_30_days",
    primary_cleaning_intent: "maintenance_clean",
    recurring_cadence_intent: "biweekly",
    layout_type: "mixed",
    bathroom_complexity: "standard",
  };
}

/** Mirrors `BookingsService.createBooking` envelope shape for `outputJson`. */
async function buildPersistedOutputJsonBlob(input: EstimateInput): Promise<string> {
  const estimator = new EstimatorService(mockFoService, mockDeepCleanEstimatorConfig);
  const engineV2 = new EstimateEngineV2Service();
  const est = await estimator.estimate(input);
  const estimateV2 = engineV2.estimateV2(input);
  const reconciliation = engineV2.calculateReconciliation({
    v1Minutes: est.estimatedDurationMinutes,
    v1PriceCents: est.estimatedPriceCents,
    v2ExpectedMinutes: estimateV2.expectedMinutes,
    v2PricedMinutes: estimateV2.pricedMinutes,
    v2PriceCents: estimateV2.customerVisible.estimatedPrice ?? 0,
  });
  return JSON.stringify({
    ...est,
    estimateVersion: estimateV2.snapshotVersion,
    estimateV2,
    reconciliation,
    legacy: {
      durationMinutes: est.estimatedDurationMinutes,
      priceCents: est.estimatedPriceCents,
      confidence: est.confidence,
    },
    rawNormalizedIntake: input,
  });
}

describe("estimate snapshot confidence + escalation persistence (verification)", () => {
  it("persists confidenceBreakdown and escalationGovernance on new snapshot-shaped blobs", async () => {
    const raw = await buildPersistedOutputJsonBlob(baseEstimateInput());
    const parsed = tryParseEstimateSnapshotOutputJson(raw);
    expect(parsed).not.toBeNull();

    const breakdown = tryReadConfidenceBreakdownFromSnapshotOutput(parsed ?? undefined);
    expect(breakdown?.schemaVersion).toBe("estimate_confidence_breakdown_v1");
    expect(typeof breakdown?.overallConfidence).toBe("number");

    const gov = tryReadEscalationGovernanceFromSnapshotOutput(parsed ?? undefined);
    expect(gov?.schemaVersion).toBe("estimate_escalation_governance_v1");
    expect(typeof gov?.escalationLevel).toBe("string");
    expect(Array.isArray(gov?.recommendedActions)).toBe(true);
  });

  it("historical blob without governance fields parses safely", () => {
    const legacy = JSON.stringify({
      estimatedDurationMinutes: 140,
      estimatedPriceCents: 14000,
      confidence: 0.85,
      legacy: { durationMinutes: 140, priceCents: 14000, confidence: 0.85 },
    });
    const parsed = tryParseEstimateSnapshotOutputJson(legacy);
    expect(parsed).not.toBeNull();
    expect(tryReadConfidenceBreakdownFromSnapshotOutput(parsed ?? undefined)).toBeUndefined();
    expect(tryReadEscalationGovernanceFromSnapshotOutput(parsed ?? undefined)).toBeUndefined();
    expect(readGovernanceLevelFromSnapshotOutputJson(legacy)).toBeNull();
  });

  it("partial blob with confidenceBreakdown only still parses safely", () => {
    const partial = JSON.stringify({
      confidenceBreakdown: {
        schemaVersion: "estimate_confidence_breakdown_v1",
        overallConfidence: 0.7,
        confidenceClassification: "medium",
      },
      estimatedPriceCents: 12000,
    });
    const parsed = tryParseEstimateSnapshotOutputJson(partial);
    expect(tryReadConfidenceBreakdownFromSnapshotOutput(parsed ?? undefined)?.schemaVersion).toBe(
      "estimate_confidence_breakdown_v1",
    );
    expect(tryReadEscalationGovernanceFromSnapshotOutput(parsed ?? undefined)).toBeUndefined();
  });

  it("admin-tolerant reads never throw on empty, invalid, or null JSON", () => {
    expect(() => readGovernanceLevelFromSnapshotOutputJson(null)).not.toThrow();
    expect(readGovernanceLevelFromSnapshotOutputJson(null)).toBeNull();
    expect(readGovernanceLevelFromSnapshotOutputJson("")).toBeNull();
    expect(readGovernanceLevelFromSnapshotOutputJson("{not json")).toBeNull();
    expect(readGovernanceLevelFromSnapshotOutputJson("[]")).toBeNull();
  });

  it("deterministic governance metadata for identical estimate input", async () => {
    const input = baseEstimateInput();
    const a = await buildPersistedOutputJsonBlob(input);
    const b = await buildPersistedOutputJsonBlob(input);
    const govA = tryReadEscalationGovernanceFromSnapshotOutput(
      tryParseEstimateSnapshotOutputJson(a) ?? undefined,
    );
    const govB = tryReadEscalationGovernanceFromSnapshotOutput(
      tryParseEstimateSnapshotOutputJson(b) ?? undefined,
    );
    expect(JSON.stringify(govA)).toBe(JSON.stringify(govB));
  });

  it("estimate learning snapshot extraction tolerates modern blobs with extra keys", async () => {
    const raw = await buildPersistedOutputJsonBlob(baseEstimateInput());
    const learning = new EstimateLearningService();
    const extracted = learning.extractLearningInputsFromSnapshot(raw);
    expect(extracted.legacyV1Minutes ?? extracted.estimateV2ExpectedMinutes).toBeTruthy();
  });

  it("mapBookingWithEvents preserves estimateSnapshot without requiring new fields", () => {
    const row = {
      id: "bk_1",
      estimateSnapshot: {
        outputJson: JSON.stringify({ confidence: 0.8 }),
        confidence: 0.8,
      },
      BookingEvent: [],
    };
    const svc = new BookingsService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const mapped = svc.mapBookingWithEvents(row) as Record<string, unknown>;
    expect(mapped.estimateSnapshot).toEqual(row.estimateSnapshot);
    expect(mapped.events).toEqual([]);
  });

  it("selector helpers derive weakest domains and escalation summary from persisted blob", async () => {
    const raw = await buildPersistedOutputJsonBlob(baseEstimateInput());
    const parsed = tryParseEstimateSnapshotOutputJson(raw);
    const bd = tryReadConfidenceBreakdownFromSnapshotOutput(parsed ?? undefined);
    expect(bd).toBeTruthy();
    const weakest = getWeakestConfidenceDomains(bd, 3);
    expect(weakest.length).toBeGreaterThan(0);
    expect([...weakest].sort((a, b) => a.score - b.score)).toEqual(weakest);
    const drivers = getTopUncertaintyDrivers(bd, 50);
    expect(Array.isArray(drivers)).toBe(true);
    const gov = tryReadEscalationGovernanceFromSnapshotOutput(parsed ?? undefined);
    const summary = getEscalationSummary(gov);
    expect(summary.escalationLevel).toBeTruthy();
    expect(summary.recommendedActions.length).toBeGreaterThan(0);
  });

  it("readGovernanceLevelFromSnapshotOutputJson is null on empty object blob", () => {
    expect(readGovernanceLevelFromSnapshotOutputJson("{}")).toBeNull();
  });
});
