import { getServiceBySlug, getLocationBySlug } from "./seoValidation";
import type { ServiceDefinition } from "./seoConfig";
import type { LocationDefinition } from "./seoConfig";

export type ParsedBookingSeoParams = {
  serviceSlug?: string;
  locationSlug?: string;
  service?: ServiceDefinition | null;
  location?: LocationDefinition | null;
};

/**
 * Parse booking entry query params. Invalid slugs are ignored.
 * Valid service + invalid location → keep service only.
 * Valid location + invalid service → keep location only.
 */
export function parseBookingSeoParams(searchParams: URLSearchParams): ParsedBookingSeoParams {
  const serviceSlug = searchParams.get("service") ?? undefined;
  const locationSlug = searchParams.get("location") ?? undefined;
  const service = serviceSlug ? getServiceBySlug(serviceSlug) : null;
  const location = locationSlug ? getLocationBySlug(locationSlug) : null;
  return {
    serviceSlug: service ? serviceSlug : undefined,
    locationSlug: location ? locationSlug : undefined,
    service: service ?? null,
    location: location ?? null,
  };
}
