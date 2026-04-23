/**
 * Builds a single-line US-style address string for geocoding providers.
 * Trims, collapses internal whitespace, and omits empty unit.
 */
export type ServiceLocationParts = {
  street: string;
  city: string;
  state: string;
  zip: string;
  unit?: string;
};

export function buildCanonicalServiceAddress(parts: ServiceLocationParts): string {
  const street = String(parts.street ?? "").trim().replace(/\s+/g, " ");
  const city = String(parts.city ?? "").trim().replace(/\s+/g, " ");
  const state = String(parts.state ?? "").trim().replace(/\s+/g, " ");
  const zip = String(parts.zip ?? "").trim().replace(/\s+/g, " ");
  const unit = String(parts.unit ?? "").trim().replace(/\s+/g, " ");
  const line1 = unit ? `${street}, ${unit}` : street;
  return [line1, `${city}, ${state} ${zip}`].filter(Boolean).join(", ");
}

export function isCompleteServiceLocation(
  sl: Partial<ServiceLocationParts> | null | undefined,
): sl is ServiceLocationParts {
  if (!sl) return false;
  const street = String(sl.street ?? "").trim();
  const city = String(sl.city ?? "").trim();
  const state = String(sl.state ?? "").trim();
  const zip = String(sl.zip ?? "").trim();
  return (
    street.length >= 3 &&
    city.length >= 2 &&
    state.length >= 2 &&
    zip.replace(/\s/g, "").length >= 5
  );
}
