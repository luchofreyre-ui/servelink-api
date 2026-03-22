import { SERVICE_DEFINITIONS, LOCATION_DEFINITIONS, AREA_PAGE_CITY_SLUGS } from "./seoConfig";
import { getAreaPagePath } from "./seoUrls";
import { getServiceBySlug, getLocationBySlug } from "./seoValidation";
import {
  getServiceLinkLabel,
  getServiceLocationLinkLabel,
} from "./linkLabels";
import type { ServiceSlug } from "./seoConfig";

export type RelatedLink = { href: string; label: string };

/**
 * Homepage related links: /house-cleaning, /deep-cleaning, /move-out-cleaning,
 * /house-cleaning/tulsa, /deep-cleaning/tulsa, /move-out-cleaning/tulsa.
 */
export function getHomepageRelatedLinks(): RelatedLink[] {
  const house = getServiceBySlug("house-cleaning");
  const deep = getServiceBySlug("deep-cleaning");
  const moveOut = getServiceBySlug("move-out-cleaning");
  if (!house || !deep || !moveOut) return [];
  return [
    { href: "/house-cleaning", label: getServiceLinkLabel(house.name) },
    { href: "/deep-cleaning", label: getServiceLinkLabel(deep.name) },
    { href: "/move-out-cleaning", label: getServiceLinkLabel(moveOut.name) },
    { href: "/house-cleaning/tulsa", label: getServiceLocationLinkLabel(house.name, "Tulsa") },
    { href: "/deep-cleaning/tulsa", label: getServiceLocationLinkLabel(deep.name, "Tulsa") },
    { href: "/move-out-cleaning/tulsa", label: getServiceLocationLinkLabel(moveOut.name, "Tulsa") },
    ...AREA_PAGE_CITY_SLUGS.map((slug) => {
      const loc = getLocationBySlug(slug);
      return loc ? { href: getAreaPagePath(slug), label: `${loc.name} cleaning services` } : null;
    }).filter((x): x is RelatedLink => x !== null),
  ];
}

/**
 * Location page related links: all 5 service/location links for current location,
 * plus /house-cleaning, /deep-cleaning, /move-out-cleaning.
 */
export function getLocationRelatedLinks(currentLocationSlug: string): RelatedLink[] {
  const location = getLocationBySlug(currentLocationSlug);
  if (!location) return [];
  const links: RelatedLink[] = SERVICE_DEFINITIONS.map((service) => ({
    href: `/${service.slug}/${currentLocationSlug}`,
    label: getServiceLocationLinkLabel(service.name, location.name),
  }));
  const house = getServiceBySlug("house-cleaning");
  const deep = getServiceBySlug("deep-cleaning");
  const moveOut = getServiceBySlug("move-out-cleaning");
  if (house) links.push({ href: "/house-cleaning", label: getServiceLinkLabel(house.name) });
  if (deep) links.push({ href: "/deep-cleaning", label: getServiceLinkLabel(deep.name) });
  if (moveOut) links.push({ href: "/move-out-cleaning", label: getServiceLinkLabel(moveOut.name) });
  return links;
}

/**
 * Links to other service pages (excluding current). Deterministic from seeded definitions.
 */
export function getRelatedServiceLinks(currentServiceSlug: string): RelatedLink[] {
  return SERVICE_DEFINITIONS.filter((s) => s.slug !== currentServiceSlug).map((s) => ({
    href: `/${s.slug}`,
    label: getServiceLinkLabel(s.name),
  }));
}

/**
 * Service page related links: other services plus house/deep/move-out in Tulsa.
 */
export function getServicePageRelatedLinks(currentServiceSlug: string): RelatedLink[] {
  const house = getServiceBySlug("house-cleaning");
  const deep = getServiceBySlug("deep-cleaning");
  const moveOut = getServiceBySlug("move-out-cleaning");
  const tulsa = getLocationBySlug("tulsa");
  const base = getRelatedServiceLinks(currentServiceSlug);
  if (!tulsa) return base;
  const tulsaLinks: RelatedLink[] = [];
  if (house) tulsaLinks.push({ href: "/house-cleaning/tulsa", label: getServiceLocationLinkLabel(house.name, tulsa.name) });
  if (deep) tulsaLinks.push({ href: "/deep-cleaning/tulsa", label: getServiceLocationLinkLabel(deep.name, tulsa.name) });
  if (moveOut) tulsaLinks.push({ href: "/move-out-cleaning/tulsa", label: getServiceLocationLinkLabel(moveOut.name, tulsa.name) });
  return [...base, ...tulsaLinks];
}

/**
 * Same service in other seeded city/neighborhood pages, plus 3 related services for same location.
 * Deterministic from seeded definitions only.
 */
export function getRelatedServiceLocationLinks(
  currentServiceSlug: string,
  currentLocationSlug: string
): RelatedLink[] {
  const links: RelatedLink[] = [];
  const currentLocation = getLocationBySlug(currentLocationSlug);
  const currentService = getServiceBySlug(currentServiceSlug);
  if (!currentLocation) return links;

  for (const loc of LOCATION_DEFINITIONS) {
    if (loc.slug !== currentLocationSlug) {
      links.push({
        href: `/${currentServiceSlug}/${loc.slug}`,
        label: getServiceLocationLinkLabel(
          currentService?.name ?? currentServiceSlug,
          loc.name
        ),
      });
    }
  }

  const relatedSlugs: ServiceSlug[] = ["house-cleaning", "deep-cleaning", "move-out-cleaning"];
  for (const slug of relatedSlugs) {
    if (slug !== currentServiceSlug) {
      const service = getServiceBySlug(slug);
      if (service) {
        links.push({
          href: `/${slug}/${currentLocationSlug}`,
          label: getServiceLocationLinkLabel(service.name, currentLocation.name),
        });
      }
    }
  }

  return links;
}

/**
 * Same service in neighborhoods of the current city (e.g. on /house-cleaning/tulsa show Brookside, Downtown, Cherry Street).
 * Returns [] if location has no seeded neighborhoods.
 */
export function getNeighborhoodServiceLinks(
  serviceSlug: string,
  currentLocationSlug: string
): RelatedLink[] {
  const currentLocation = getLocationBySlug(currentLocationSlug);
  const service = getServiceBySlug(serviceSlug);
  if (!currentLocation || !service) return [];
  if (currentLocation.type !== "city") return [];
  const cityName = currentLocation.name;
  const neighborhoods = LOCATION_DEFINITIONS.filter(
    (l) => l.type === "neighborhood" && "parentCity" in l && (l as { parentCity: string }).parentCity === cityName
  );
  return neighborhoods.map((loc) => ({
    href: `/${serviceSlug}/${loc.slug}`,
    label: getServiceLocationLinkLabel(service.name, loc.name),
  }));
}
