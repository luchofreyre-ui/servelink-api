import type { ServiceMatrixShadowSourceSurface } from "./service-matrix.types";

export type ServiceMatrixShadowRuntimeConfig = {
  masterEnabled: boolean;
  sampleRate: number;
  /** Normalized lowercase surface tokens (e.g. `public_booking`). */
  surfaces: Set<string>;
};

function truthyMaster(raw: string | undefined): boolean {
  const t = String(raw ?? "").trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes" || t === "on";
}

function parseSampleRate(raw: string | undefined): number {
  const s = String(raw ?? "").trim();
  if (s === "") return 0;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 1) return 0;
  return n;
}

/**
 * Reads shadow runtime flags from env. Malformed values default to **safe off**.
 * When `SERVICE_MATRIX_SHADOW_SURFACES` is unset or empty, defaults to `public_booking` only.
 */
export function parseServiceMatrixShadowConfig(
  env: NodeJS.ProcessEnv = process.env,
): ServiceMatrixShadowRuntimeConfig {
  const masterEnabled = truthyMaster(env.ENABLE_SERVICE_MATRIX_SHADOW);
  const sampleRate = parseSampleRate(env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE);

  const surfRaw = String(env.SERVICE_MATRIX_SHADOW_SURFACES ?? "").trim();
  const tokens =
    surfRaw === ""
      ? ["public_booking"]
      : surfRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

  return {
    masterEnabled,
    sampleRate,
    surfaces: new Set(tokens),
  };
}

/**
 * @param randomValue — optional roll in [0, 1); when omitted uses `Math.random()`.
 *                      Shadow runs when `randomValue < sampleRate` (standard Bernoulli).
 */
export function shouldRunServiceMatrixShadow(
  config: ServiceMatrixShadowRuntimeConfig,
  sourceSurface: ServiceMatrixShadowSourceSurface,
  randomValue?: number,
): boolean {
  if (!config.masterEnabled) return false;
  if (!Number.isFinite(config.sampleRate) || config.sampleRate <= 0) return false;
  const surf = String(sourceSurface).trim().toLowerCase();
  if (!config.surfaces.has(surf)) return false;
  const roll = randomValue !== undefined ? randomValue : Math.random();
  return roll < config.sampleRate;
}
