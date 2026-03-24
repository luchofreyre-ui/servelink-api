/**
 * Persisted JSON shape for DeepCleanEstimatorConfig.configJson.
 * Applied only on new deep clean estimates (active version at quote time).
 */

export type DeepCleanVisitDurationMultipliers = {
  visit1: number;
  visit2: number;
  visit3: number;
};

export type DeepCleanEstimatorConfigPayload = {
  globalDurationMultiplier: number;
  singleVisitDurationMultiplier: number;
  threeVisitDurationMultiplier: number;
  visitDurationMultipliers: DeepCleanVisitDurationMultipliers;
  bedroomAdditiveMinutes: number;
  bathroomAdditiveMinutes: number;
  petAdditiveMinutes: number;
  /** Extra labor minutes when kitchen_condition is heavy_grease */
  kitchenHeavySoilAdditiveMinutes: number;
  minimumVisitDurationMinutes: number;
  minimumProgramDurationMinutes: number;
};

export const DEFAULT_DEEP_CLEAN_ESTIMATOR_CONFIG: DeepCleanEstimatorConfigPayload = {
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
};

const MULT_MIN = 0.5;
const MULT_MAX = 2;
const ADD_MIN = -120;
const ADD_MAX = 240;
const MIN_DUR_MAX = 720;

export class DeepCleanEstimatorConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeepCleanEstimatorConfigValidationError";
  }
}

function assertMultiplier(name: string, v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new DeepCleanEstimatorConfigValidationError(`${name} must be a finite number`);
  }
  if (v < MULT_MIN || v > MULT_MAX) {
    throw new DeepCleanEstimatorConfigValidationError(
      `${name} must be between ${MULT_MIN} and ${MULT_MAX}`,
    );
  }
  return v;
}

function assertAdditive(name: string, v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new DeepCleanEstimatorConfigValidationError(`${name} must be a finite number`);
  }
  if (v < ADD_MIN || v > ADD_MAX) {
    throw new DeepCleanEstimatorConfigValidationError(
      `${name} must be between ${ADD_MIN} and ${ADD_MAX}`,
    );
  }
  return v;
}

function assertMinDuration(name: string, v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new DeepCleanEstimatorConfigValidationError(`${name} must be a finite number`);
  }
  if (v < 0 || v > MIN_DUR_MAX) {
    throw new DeepCleanEstimatorConfigValidationError(
      `${name} must be between 0 and ${MIN_DUR_MAX}`,
    );
  }
  return Math.round(v);
}

/** Parse + validate JSON from DB or API; returns normalized payload. */
export function parseAndValidateDeepCleanEstimatorConfig(
  raw: unknown,
): DeepCleanEstimatorConfigPayload {
  if (!raw || typeof raw !== "object") {
    throw new DeepCleanEstimatorConfigValidationError("config must be an object");
  }
  const o = raw as Record<string, unknown>;
  const vm = o.visitDurationMultipliers;
  if (!vm || typeof vm !== "object") {
    throw new DeepCleanEstimatorConfigValidationError("visitDurationMultipliers required");
  }
  const vmo = vm as Record<string, unknown>;

  return {
    globalDurationMultiplier: assertMultiplier("globalDurationMultiplier", o.globalDurationMultiplier),
    singleVisitDurationMultiplier: assertMultiplier(
      "singleVisitDurationMultiplier",
      o.singleVisitDurationMultiplier,
    ),
    threeVisitDurationMultiplier: assertMultiplier(
      "threeVisitDurationMultiplier",
      o.threeVisitDurationMultiplier,
    ),
    visitDurationMultipliers: {
      visit1: assertMultiplier("visitDurationMultipliers.visit1", vmo.visit1),
      visit2: assertMultiplier("visitDurationMultipliers.visit2", vmo.visit2),
      visit3: assertMultiplier("visitDurationMultipliers.visit3", vmo.visit3),
    },
    bedroomAdditiveMinutes: assertAdditive("bedroomAdditiveMinutes", o.bedroomAdditiveMinutes),
    bathroomAdditiveMinutes: assertAdditive("bathroomAdditiveMinutes", o.bathroomAdditiveMinutes),
    petAdditiveMinutes: assertAdditive("petAdditiveMinutes", o.petAdditiveMinutes),
    kitchenHeavySoilAdditiveMinutes: assertAdditive(
      "kitchenHeavySoilAdditiveMinutes",
      o.kitchenHeavySoilAdditiveMinutes,
    ),
    minimumVisitDurationMinutes: assertMinDuration(
      "minimumVisitDurationMinutes",
      o.minimumVisitDurationMinutes,
    ),
    minimumProgramDurationMinutes: assertMinDuration(
      "minimumProgramDurationMinutes",
      o.minimumProgramDurationMinutes,
    ),
  };
}

export function isNeutralDeepCleanEstimatorConfig(
  c: DeepCleanEstimatorConfigPayload,
): boolean {
  return (
    c.globalDurationMultiplier === 1 &&
    c.singleVisitDurationMultiplier === 1 &&
    c.threeVisitDurationMultiplier === 1 &&
    c.visitDurationMultipliers.visit1 === 1 &&
    c.visitDurationMultipliers.visit2 === 1 &&
    c.visitDurationMultipliers.visit3 === 1 &&
    c.bedroomAdditiveMinutes === 0 &&
    c.bathroomAdditiveMinutes === 0 &&
    c.petAdditiveMinutes === 0 &&
    c.kitchenHeavySoilAdditiveMinutes === 0 &&
    c.minimumVisitDurationMinutes === 0 &&
    c.minimumProgramDurationMinutes === 0
  );
}
