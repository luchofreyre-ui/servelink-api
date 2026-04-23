/**
 * Central production supply primitives for franchise owners used on the
 * customer matching path (`FoService.matchFOs` after DB status filter and
 * `evaluateFoExecutionReadiness` provider checks).
 *
 * `matchableServiceTypes`: empty array = unrestricted (all service types), per schema comment.
 */

export type FoSupplyReadinessReason =
  | "FO_MISSING_COORDINATES"
  | "FO_INVALID_COORDINATES"
  | "FO_INVALID_TRAVEL_CONSTRAINT"
  | "FO_NO_SCHEDULING_SOURCE"
  | "FO_INVALID_CAPACITY_CONFIG";

export type FoSupplyReadinessInput = {
  homeLat: number | null;
  homeLng: number | null;
  maxTravelMinutes: number | null;
  maxDailyLaborMinutes: number | null;
  maxLaborMinutes: number | null;
  maxSquareFootage: number | null;
  /** Count of `FoSchedule` rows for this FO. */
  scheduleRowCount: number;
};

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/**
 * Returns reasons why an FO should not participate in customer-path matching.
 * Status / safetyHold / bans are enforced in `FoService.getEligibleFOs` and `getEligibility`.
 */
export function evaluateFoSupplyReadiness(
  fo: FoSupplyReadinessInput,
): { ok: boolean; reasons: FoSupplyReadinessReason[] } {
  const reasons: FoSupplyReadinessReason[] = [];

  const lat = fo.homeLat;
  const lng = fo.homeLng;
  if (lat == null || lng == null) {
    reasons.push("FO_MISSING_COORDINATES");
    return { ok: false, reasons };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    reasons.push("FO_INVALID_COORDINATES");
    return { ok: false, reasons };
  }
  if (!isValidLatLng(lat, lng)) {
    reasons.push("FO_INVALID_COORDINATES");
    return { ok: false, reasons };
  }

  /**
   * `maxTravelMinutes` null: treat as unset — DB default is 60; legacy null skips travel cap in matchFOs.
   * Zero is invalid (would skip the guard in matchFOs and behave like "no limit").
   */
  if (
    fo.maxTravelMinutes != null &&
    (!Number.isFinite(fo.maxTravelMinutes) || fo.maxTravelMinutes < 1)
  ) {
    reasons.push("FO_INVALID_TRAVEL_CONSTRAINT");
  }

  if (fo.scheduleRowCount < 1) {
    reasons.push("FO_NO_SCHEDULING_SOURCE");
  }

  const capInvalid =
    (fo.maxDailyLaborMinutes != null &&
      (!Number.isFinite(fo.maxDailyLaborMinutes) || fo.maxDailyLaborMinutes < 1)) ||
    (fo.maxLaborMinutes != null &&
      (!Number.isFinite(fo.maxLaborMinutes) || fo.maxLaborMinutes < 1)) ||
    (fo.maxSquareFootage != null &&
      (!Number.isFinite(fo.maxSquareFootage) || fo.maxSquareFootage < 1));
  if (capInvalid) {
    reasons.push("FO_INVALID_CAPACITY_CONFIG");
  }

  return { ok: reasons.length === 0, reasons };
}
