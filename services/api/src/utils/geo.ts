/**
 * Geospatial helpers (no external deps).
 * - Deterministic
 * - Fast enough for per-ping evaluation
 */

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two lat/lng points in meters.
 */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Geofence check with accuracy buffer:
 * A ping is considered inside if distance <= radius + accuracy.
 *
 * If accuracy is missing/invalid, we treat it as 0 (strict).
 */
export function isInsideGeofence(args: {
  pingLat: number;
  pingLng: number;
  siteLat: number;
  siteLng: number;
  radiusMeters: number;
  accuracyMeters?: number;
}): { inside: boolean; distanceMeters: number; thresholdMeters: number } {
  const distanceMeters = haversineMeters(
    args.pingLat,
    args.pingLng,
    args.siteLat,
    args.siteLng,
  );

  const accuracy =
    typeof args.accuracyMeters === "number" && Number.isFinite(args.accuracyMeters) && args.accuracyMeters > 0
      ? args.accuracyMeters
      : 0;

  const thresholdMeters = args.radiusMeters + accuracy;

  return {
    inside: distanceMeters <= thresholdMeters,
    distanceMeters,
    thresholdMeters,
  };
}
