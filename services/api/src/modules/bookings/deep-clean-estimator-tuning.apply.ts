import type { DeepCleanEstimatorConfigPayload } from "./deep-clean-estimator-config.types";
import { isNeutralDeepCleanEstimatorConfig } from "./deep-clean-estimator-config.types";

const PHASE_LABOR_WEIGHTS = [0.52, 0.26, 0.22] as const;

function splitLaborThreeWays(totalMinutes: number): [number, number, number] {
  const t = Math.max(0, Math.round(totalMinutes));
  if (t === 0) return [0, 0, 0];
  const w = PHASE_LABOR_WEIGHTS;
  const a = Math.round(t * w[0]);
  const b = Math.round(t * w[1]);
  const c = Math.max(0, t - a - b);
  return [a, b, c];
}

/**
 * Deterministic tuning on total adjusted labor minutes (deep clean path only).
 *
 * Order: base labor → additive minutes → global × program-type multipliers →
 * split by visit (phased) → per-visit multipliers → min visit labor → min program wall time.
 *
 * When config is neutral, returns `baseAdjustedLaborMinutes` exactly (no rounding drift).
 */
export function applyDeepCleanEstimatorTuningToLabor(args: {
  baseAdjustedLaborMinutes: number;
  effectiveTeamSize: number;
  programMode: "single_visit" | "phased_3_visit";
  bedroomsCount: number;
  bathroomsCount: number;
  hasPets: boolean;
  kitchenHeavyGrease: boolean;
  config: DeepCleanEstimatorConfigPayload;
}): number {
  const { config } = args;
  if (isNeutralDeepCleanEstimatorConfig(config)) {
    return Math.max(0, Math.round(args.baseAdjustedLaborMinutes));
  }

  const team = Math.max(1, args.effectiveTeamSize);
  let labor = Math.max(0, args.baseAdjustedLaborMinutes);

  labor +=
    args.bedroomsCount * config.bedroomAdditiveMinutes +
    args.bathroomsCount * config.bathroomAdditiveMinutes +
    (args.hasPets ? config.petAdditiveMinutes : 0) +
    (args.kitchenHeavyGrease ? config.kitchenHeavySoilAdditiveMinutes : 0);

  labor *= config.globalDurationMultiplier;
  labor *=
    args.programMode === "single_visit"
      ? config.singleVisitDurationMultiplier
      : config.threeVisitDurationMultiplier;

  labor = Math.max(0, Math.round(labor));

  const w = config.visitDurationMultipliers;
  let visitLabors: number[];
  if (args.programMode === "single_visit") {
    visitLabors = [Math.round(labor * w.visit1)];
  } else {
    const [a, b, c] = splitLaborThreeWays(labor);
    visitLabors = [
      Math.round(a * w.visit1),
      Math.round(b * w.visit2),
      Math.round(c * w.visit3),
    ];
  }

  const minLabor = config.minimumVisitDurationMinutes * team;
  if (minLabor > 0) {
    visitLabors = visitLabors.map((v) => Math.max(v, minLabor));
  }

  const durations = visitLabors.map((v) => Math.ceil(v / team));
  const minProg = config.minimumProgramDurationMinutes;
  let totalDur = durations.reduce((s, d) => s + d, 0);
  if (minProg > 0 && totalDur < minProg) {
    const need = minProg - totalDur;
    const last = visitLabors.length - 1;
    visitLabors[last] += need * team;
  }

  const totalLabor = visitLabors.reduce((s, v) => s + v, 0);
  return Math.max(0, Math.round(totalLabor));
}
