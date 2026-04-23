/**
 * Single source of truth for platform / service crew-size ceilings and clamps.
 * Residential caps never inherit the global platform ceiling for assignment logic.
 */

export const GLOBAL_MAX_CREW_SIZE = 11;

/** Residential deep clean — max crew used for assignment / recommendations (not platform 11). */
export const RESIDENTIAL_MAX_CREW_DEEP_CLEAN = 6;

/** Residential standard / maintenance — same cap as deep clean for this product. */
export const RESIDENTIAL_MAX_CREW_MAINTENANCE = 6;

/** Move-in / move-out treated as residential for crew caps in this pass. */
export const RESIDENTIAL_MAX_CREW_MOVE = 6;

export const COMMERCIAL_MAX_CREW_SIZE = 11;

export const RESIDENTIAL_MIN_CREW_SIZE = 1;
export const COMMERCIAL_MIN_CREW_SIZE = 1;

export type ServiceSegment = "residential" | "commercial";

export function clampCrewSizeToGlobalMax(n: number): number {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x) || x < 1) return 1;
  return Math.min(GLOBAL_MAX_CREW_SIZE, x);
}

/**
 * Max crew for scheduling/recommendation for this service + site segment.
 * Commercial segment always uses {@link COMMERCIAL_MAX_CREW_SIZE}.
 */
export function getServiceMaxCrewSize(
  serviceType: string,
  segment: ServiceSegment,
): number {
  if (segment === "commercial") {
    return COMMERCIAL_MAX_CREW_SIZE;
  }
  const st = String(serviceType ?? "").trim();
  if (st === "deep_clean") return RESIDENTIAL_MAX_CREW_DEEP_CLEAN;
  if (st === "maintenance") return RESIDENTIAL_MAX_CREW_MAINTENANCE;
  if (st === "move_in" || st === "move_out") return RESIDENTIAL_MAX_CREW_MOVE;
  return RESIDENTIAL_MAX_CREW_MAINTENANCE;
}

export function getServiceMinCrewSize(segment: ServiceSegment): number {
  return segment === "commercial"
    ? COMMERCIAL_MIN_CREW_SIZE
    : RESIDENTIAL_MIN_CREW_SIZE;
}

/**
 * Clamp a raw crew count to [1, min(global max, service max)] for the given service + segment.
 */
export function clampCrewSizeForService(
  serviceType: string,
  segment: ServiceSegment,
  raw: number,
): number {
  const cap = Math.min(GLOBAL_MAX_CREW_SIZE, getServiceMaxCrewSize(serviceType, segment));
  const lo = getServiceMinCrewSize(segment);
  const x = Math.floor(Number(raw));
  if (!Number.isFinite(x)) return lo;
  return Math.max(lo, Math.min(cap, x));
}
