/**
 * TEMPORARY diagnostic: controlled estimator scenarios + inflation breakdown.
 * Measurement only — not imported by production.
 *
 * Run from repo root:
 *   npx tsx services/api/scripts/diagnostics/estimate-scenario-breakdown.ts
 */
import { EstimatorService, type EstimateInput } from "../../src/modules/estimate/estimator.service";
import { RecurringPlanService } from "../../src/modules/recurring-plan/recurring-plan.service";
import type { FoService } from "../../src/modules/fo/fo.service";
import type { DeepCleanEstimatorConfigService } from "../../src/modules/bookings/deep-clean-estimator-config.service";

function sqftToBand(sqft: number): EstimateInput["sqft_band"] {
  const x = Math.max(0, Math.floor(sqft));
  if (x <= 799) return "0_799";
  if (x <= 1199) return "800_1199";
  if (x <= 1599) return "1200_1599";
  if (x <= 1999) return "1600_1999";
  if (x <= 2499) return "2000_2499";
  if (x <= 2999) return "2500_2999";
  if (x <= 3499) return "3000_3499";
  return "3500_plus";
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function pctRatio(part: number, whole: number): string {
  if (whole <= 0) return "n/a";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

/** Diagnostic mirror of recurring hard caps (keep in sync with recurring-plan.service.ts). */
const DIAG_RECURRING_HARD_CAP_RATIO: Record<
  "weekly" | "every_10_days" | "biweekly" | "monthly",
  number
> = {
  weekly: 0.6,
  every_10_days: 0.66,
  biweekly: 0.7,
  monthly: 0.75,
};

function recurringCapPinned(
  recurringMinutes: number,
  estimatedDurationMinutes: number,
  cadence: keyof typeof DIAG_RECURRING_HARD_CAP_RATIO,
): boolean {
  const cap = DIAG_RECURRING_HARD_CAP_RATIO[cadence];
  return recurringMinutes >= Math.floor(estimatedDurationMinutes * cap);
}

const mockFoService = {
  matchFOs: async () => [],
} as unknown as FoService;

const mockDeepCleanConfig = {
  getActiveForEstimate: async () => null,
} as unknown as DeepCleanEstimatorConfigService;

const estimator = new EstimatorService(mockFoService, mockDeepCleanConfig);
/** `getRecurringOfferQuote` is stateless; Prisma unused for this call. */
const recurringPlan = new RecurringPlanService(null as never);

type Scenario = {
  name: string;
  input: EstimateInput;
  recurringCadenceFilter?: "weekly" | "every_10_days" | "biweekly" | "monthly";
};

function basePartial(): Partial<EstimateInput> {
  return {
    property_type: "house",
    stovetop_type: "flat_glass",
    glass_showers: "none",
    pet_accidents_or_litter_areas: "no",
    occupancy_state: "occupied_normal",
    floor_visibility: "mostly_clear",
    carpet_percent: "26_50",
    last_professional_clean: "1_3_months",
    last_pro_clean_recency: "days_30_90",
    primary_cleaning_intent: "detailed_standard",
    overall_labor_condition: "normal_lived_in",
    layout_type: "mixed",
    occupancy_level: "ppl_1_2",
    children_in_home: "no",
    kitchen_intensity: "average_use",
    bathroom_complexity: "standard",
    clutter_access: "mostly_clear",
    first_time_visit_program: "one_visit",
    recurring_cadence_intent: "none",
    half_bathrooms: "0",
  };
}

const scenarios: Scenario[] = [
  {
    name: "1 — Minimal clean (maintenance)",
    input: {
      ...basePartial(),
      property_type: "house",
      sqft_band: sqftToBand(1500),
      bedrooms: "2",
      bathrooms: "1",
      floors: "1",
      service_type: "maintenance",
      first_time_with_servelink: "no",
      clutter_level: "light",
      kitchen_condition: "normal",
      bathroom_condition: "normal",
      pet_presence: "none",
      pet_impact: "none",
      stairs_flights: "none",
      addons: [],
      primary_cleaning_intent: "maintenance_clean",
      overall_labor_condition: "recently_maintained",
      clutter_access: "mostly_clear",
      recurring_cadence_intent: "weekly",
    } as EstimateInput,
    recurringCadenceFilter: "weekly",
  },
  {
    name: "2 — Standard first-time home (deep_clean)",
    input: {
      ...basePartial(),
      service_type: "deep_clean",
      deep_clean_program: "single_visit",
      sqft_band: sqftToBand(2000),
      bedrooms: "3",
      bathrooms: "2",
      floors: "1",
      first_time_with_servelink: "yes",
      clutter_level: "light",
      kitchen_condition: "normal",
      bathroom_condition: "normal",
      pet_presence: "one",
      pet_shedding: "low",
      pet_impact: "light",
      stairs_flights: "none",
      addons: [],
      recurring_cadence_intent: "weekly",
    } as EstimateInput,
    recurringCadenceFilter: "weekly",
  },
  {
    name: "3 — Heavy reset (deep_clean)",
    input: {
      ...basePartial(),
      service_type: "deep_clean",
      deep_clean_program: "single_visit",
      sqft_band: sqftToBand(2500),
      bedrooms: "4",
      bathrooms: "3",
      floors: "2",
      half_bathrooms: "1",
      stairs_flights: "one",
      first_time_with_servelink: "yes",
      clutter_level: "heavy",
      kitchen_condition: "heavy_grease",
      bathroom_condition: "heavy_scale",
      pet_presence: "multiple",
      pet_shedding: "high",
      pet_impact: "heavy",
      occupancy_state: "occupied_cluttered",
      floor_visibility: "some_obstacles",
      overall_labor_condition: "major_reset",
      primary_cleaning_intent: "reset_level",
      clutter_access: "heavy_clutter",
      kitchen_intensity: "heavy_use",
      bathroom_complexity: "heavy_detailing",
      addons: ["inside_oven", "inside_fridge"],
      recurring_cadence_intent: "biweekly",
    } as EstimateInput,
    recurringCadenceFilter: "biweekly",
  },
  {
    name: "4 — Apartment edge (maintenance)",
    input: {
      ...basePartial(),
      property_type: "apartment",
      sqft_band: sqftToBand(900),
      bedrooms: "1",
      bathrooms: "1",
      floors: "1",
      service_type: "maintenance",
      first_time_with_servelink: "no",
      clutter_level: "light",
      kitchen_condition: "normal",
      bathroom_condition: "normal",
      pet_presence: "none",
      pet_impact: "none",
      stairs_flights: "none",
      addons: [],
      primary_cleaning_intent: "maintenance_clean",
      overall_labor_condition: "recently_maintained",
      clutter_access: "mostly_clear",
      recurring_cadence_intent: "monthly",
    } as EstimateInput,
    recurringCadenceFilter: "monthly",
  },
  {
    name: "5 — Worst realistic (deep_clean; max stress)",
    input: {
      ...basePartial(),
      service_type: "deep_clean",
      deep_clean_program: "single_visit",
      sqft_band: sqftToBand(3000),
      bedrooms: "4",
      bathrooms: "3",
      floors: "2",
      half_bathrooms: "1",
      stairs_flights: "two_plus",
      first_time_with_servelink: "yes",
      clutter_level: "heavy",
      kitchen_condition: "heavy_grease",
      bathroom_condition: "heavy_scale",
      glass_showers: "multiple",
      pet_presence: "multiple",
      pet_shedding: "high",
      pet_impact: "heavy",
      pet_accidents_or_litter_areas: "yes",
      occupancy_state: "occupied_cluttered",
      floor_visibility: "lots_of_items",
      overall_labor_condition: "major_reset",
      primary_cleaning_intent: "reset_level",
      clutter_access: "heavy_clutter",
      kitchen_intensity: "heavy_use",
      bathroom_complexity: "heavy_detailing",
      layout_type: "segmented",
      addons: ["inside_oven", "inside_fridge", "interior_windows"],
      recurring_cadence_intent: "monthly",
    } as EstimateInput,
    recurringCadenceFilter: "monthly",
  },
];

function summarizeAdjustments(res: Awaited<ReturnType<EstimatorService["estimate"]>>) {
  const labels = res.breakdown.adjustments.map((a) => `${a.label}: +${a.minutes}m`);
  return labels.length ? labels.join("; ") : "(none)";
}

function recurringSnapshotForLoad(input: EstimateInput) {
  return {
    inputJson: {
      kitchenIntensity: input.kitchen_intensity,
      kitchen_intensity: input.kitchen_intensity,
      petImpact: input.pet_impact,
      pet_impact: input.pet_impact,
      petPresence: input.pet_presence,
      pet_presence: input.pet_presence,
      occupancyLevel: input.occupancy_level,
      occupancy_level: input.occupancy_level,
      childrenInHome: input.children_in_home,
      children_in_home: input.children_in_home,
    },
    outputJson: {},
  };
}

async function main() {
  console.log("=== ESTIMATE SCENARIO BREAKDOWN (diagnostic) ===\n");
  console.log(
    "Estimator V2.4 candidate — service-aware normalized whole-job drag (labor = baseLaborMinutes × service-bounded drag; recurring V2.2 lived-in + V2.1 baselines/caps).\n",
  );

  for (const sc of scenarios) {
    console.log("─".repeat(72));
    console.log(`SCENARIO ${sc.name}`);
    console.log("Input summary:");
    console.log(
      `  service_type: ${sc.input.service_type} | sqft_band: ${sc.input.sqft_band} | beds: ${sc.input.bedrooms} | baths: ${sc.input.bathrooms}`,
    );
    console.log(
      `  half_bath: ${sc.input.half_bathrooms ?? "—"} | floors: ${sc.input.floors} | stairs: ${sc.input.stairs_flights} | pets: ${sc.input.pet_presence} / impact ${sc.input.pet_impact ?? "—"}`,
    );
    console.log(
      `  clutter_level: ${sc.input.clutter_level} | kitchen: ${sc.input.kitchen_condition} | bath: ${sc.input.bathroom_condition}`,
    );
    console.log(
      `  overall_labor: ${sc.input.overall_labor_condition ?? "—"} | intent: ${sc.input.primary_cleaning_intent ?? "—"} | recurring_intent: ${sc.input.recurring_cadence_intent ?? "—"}`,
    );
    console.log(`  addons: ${(sc.input.addons ?? []).join(", ") || "none"}`);

    const res = await estimator.estimate(sc.input);

    const baselineSum = res.breakdown.baseline.reduce((s, x) => s + x.minutes, 0);
    const adjSum = res.breakdown.adjustments.reduce((s, x) => s + x.minutes, 0);

    console.log("\nOutput:");
    console.log(`  mode: ${res.mode}`);
    console.log(`  estimateMinutes (line-item total): ${res.estimateMinutes}`);
    console.log(`  baseline sum (reported): ${baselineSum} | adjustments sum: ${adjSum}`);
    console.log(`  baseLaborMinutes: ${res.baseLaborMinutes}`);
    console.log(`  adjustedLaborMinutes: ${res.adjustedLaborMinutes}`);
    console.log(
      `  estimatedDurationMinutes (ceil labor / team eff): ${res.estimatedDurationMinutes}`,
    );
    console.log(`  estimatedPriceCents: ${res.estimatedPriceCents} (${dollars(res.estimatedPriceCents)})`);
    console.log(`  recommendedTeamSize / effectiveTeamSize: ${res.recommendedTeamSize} / ${res.effectiveTeamSize}`);
    console.log(`  riskPercentUncapped: ${res.riskPercentUncapped}`);
    console.log(`  riskPercentCappedForRange: ${res.riskPercentCappedForRange} | riskCapped: ${res.riskCapped}`);
    console.log(`  lowerBoundMinutes / upperBoundMinutes: ${res.lowerBoundMinutes} / ${res.upperBoundMinutes}`);
    console.log("\n  Breakdown.baseline:", JSON.stringify(res.breakdown.baseline));
    console.log("  Breakdown.adjustments (line-item):", summarizeAdjustments(res));
    console.log("  Breakdown.riskSignals:", JSON.stringify(res.breakdown.riskSignals));

    const quotes = recurringPlan.getRecurringOfferQuote({
      firstCleanPriceCents: res.estimatedPriceCents,
      estimatedMinutes: res.estimatedDurationMinutes,
      estimateSnapshot: recurringSnapshotForLoad(sc.input),
      cadence: sc.recurringCadenceFilter,
    });
    const q = quotes[0];
    if (q && sc.recurringCadenceFilter) {
      const dur = res.estimatedDurationMinutes;
      const capPinned = recurringCapPinned(
        q.estimatedMinutes,
        dur,
        sc.recurringCadenceFilter,
      );
      console.log("\nRecurring quote (real RecurringPlanService):");
      console.log(`  cadence: ${q.cadence} (${q.cadenceDays}d)`);
      console.log(`  estimatedMinutes (recurring): ${q.estimatedMinutes} | capPinned: ${capPinned}`);
      console.log(`  recurringPriceCents: ${q.recurringPriceCents} (${dollars(q.recurringPriceCents)})`);
      console.log(`  firstCleanPriceCents: ${q.firstCleanPriceCents} | savingsCents: ${q.savingsCents} | discountPercent: ${q.discountPercent}`);
      console.log("\n  Recurring ratio (V2.2 lived-in load; first-clean from V2.4 labor):");
      console.log(`    minutesRatio: ${pctRatio(q.estimatedMinutes, dur)}`);
      console.log(`    priceRatio: ${pctRatio(q.recurringPriceCents, q.firstCleanPriceCents)}`);
    }

    console.log("\nRaw EstimateResult (subset):");
    console.log(
      JSON.stringify(
        {
          mode: res.mode,
          estimateMinutes: res.estimateMinutes,
          baseLaborMinutes: res.baseLaborMinutes,
          adjustedLaborMinutes: res.adjustedLaborMinutes,
          estimatedDurationMinutes: res.estimatedDurationMinutes,
          estimatedPriceCents: res.estimatedPriceCents,
          riskPercentUncapped: res.riskPercentUncapped,
          riskPercentCappedForRange: res.riskPercentCappedForRange,
          confidence: res.confidence,
          flags: res.flags,
        },
        null,
        2,
      ),
    );
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
