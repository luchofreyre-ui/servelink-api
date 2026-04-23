import type { ServiceLocationParts } from "./canonical-service-address";
import { buildCanonicalServiceAddress } from "./canonical-service-address";

/**
 * Exact canonical address keys (see `buildCanonicalServiceAddress`) for the
 * public-booking FO Playwright matrix only. Used when
 * `SERVELINK_GEOCODE_MATRIX_FIXTURE_LOOKUP=true` so local validation does not
 * depend on Nominatim for these known strings.
 */
const MATRIX_FIXTURE_COORDS_BY_CANONICAL = new Map<
  string,
  { siteLat: number; siteLng: number }
>([
  [
    buildCanonicalServiceAddress({
      street: "1 E 2nd St",
      city: "Tulsa",
      state: "OK",
      zip: "74103",
    }),
    { siteLat: 36.1517447, siteLng: -95.9990288 },
  ],
  [
    buildCanonicalServiceAddress({
      street: "1919 N Florence Ave",
      city: "Tulsa",
      state: "OK",
      zip: "74110",
    }),
    { siteLat: 36.199, siteLng: -95.99277 },
  ],
  [
    buildCanonicalServiceAddress({
      street: "225 W Douglas Ave",
      city: "Wichita",
      state: "KS",
      zip: "67202",
    }),
    { siteLat: 37.6872, siteLng: -97.3301 },
  ],
]);

export function tryResolveMatrixFixtureGeocode(
  parts: ServiceLocationParts,
): { siteLat: number; siteLng: number } | null {
  const key = buildCanonicalServiceAddress(parts);
  return MATRIX_FIXTURE_COORDS_BY_CANONICAL.get(key) ?? null;
}
