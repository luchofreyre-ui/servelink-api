import type { ServiceSegment } from "../crew-capacity/crew-capacity-policy";

/**
 * Narrow booking context for FO matching / estimator integration.
 * Omitted = legacy behavior (strictest safe defaults for `matchableServiceTypes`).
 */
export type BookingMatchMode =
  | "public_one_time"
  | "authenticated_recurring"
  | "authenticated_one_time";

/** True capability restriction: FO allow-list must filter incompatible service types. */
export function shouldServiceTypeActAsHardWhitelist(
  serviceType: string | undefined,
  segment: ServiceSegment,
  bookingMatchMode: BookingMatchMode | undefined,
): boolean {
  if (segment === "commercial") {
    return true;
  }
  const st = String(serviceType ?? "").trim();
  if (
    st === "deep_clean" &&
    segment === "residential" &&
    bookingMatchMode === "public_one_time"
  ) {
    return false;
  }
  return true;
}

/** Maintenance / recurring flows that prefer the customer's last team when eligible. */
export function isContinuityFirstService(
  serviceType: string | undefined,
  bookingMatchMode: BookingMatchMode | undefined,
): boolean {
  if (bookingMatchMode !== "authenticated_recurring") {
    return false;
  }
  const st = String(serviceType ?? "").trim();
  return st === "maintenance" || st === "deep_clean";
}

export function shouldPreferPriorTeam(
  serviceType: string | undefined,
  bookingMatchMode: BookingMatchMode | undefined,
  isAuthenticated: boolean,
): boolean {
  return (
    isAuthenticated && isContinuityFirstService(serviceType, bookingMatchMode)
  );
}
