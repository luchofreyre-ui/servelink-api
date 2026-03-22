import { DEFAULT_SERVICE_AREAS_ROUTE, LOCALIZED_SERVICE_ROUTES } from "./intentCtaData";
import type { IntentCta, IntentServiceRoute, IntentServiceSlug } from "./intentCtaTypes";
import type { LocationContext } from "../../location/context/locationTypes";

function findLocalizedRouteForCity(
  serviceSlug: IntentServiceSlug,
  citySlug?: string
): IntentServiceRoute | null {
  if (!citySlug) return null;
  const route = LOCALIZED_SERVICE_ROUTES.find(
    (item) => item.serviceSlug === serviceSlug && item.citySlug === citySlug
  );
  return route ?? null;
}

function findFallbackServiceRoute(serviceSlug: IntentServiceSlug): IntentServiceRoute | null {
  const route = LOCALIZED_SERVICE_ROUTES.find((item) => item.serviceSlug === serviceSlug);
  return route ?? null;
}

export function personalizeIntentCta(params: {
  cta: IntentCta;
  serviceSlug?: IntentServiceSlug;
  locationContext?: LocationContext;
}): IntentCta {
  const { cta, serviceSlug, locationContext } = params;
  if (!serviceSlug) return cta;

  const localizedRoute = findLocalizedRouteForCity(serviceSlug, locationContext?.citySlug);
  if (localizedRoute) {
    return {
      ...cta,
      primaryLabel: "Explore " + localizedRoute.title,
      primaryHref: localizedRoute.href,
      secondaryLabel: "Browse All Service Areas",
      secondaryHref: DEFAULT_SERVICE_AREAS_ROUTE.href,
    };
  }

  const fallbackServiceRoute = findFallbackServiceRoute(serviceSlug);
  if (fallbackServiceRoute) {
    return {
      ...cta,
      primaryLabel: "Explore " + fallbackServiceRoute.title,
      primaryHref: fallbackServiceRoute.href,
      secondaryLabel: "Browse All Service Areas",
      secondaryHref: DEFAULT_SERVICE_AREAS_ROUTE.href,
    };
  }

  return {
    ...cta,
    primaryLabel: "Browse Service Areas",
    primaryHref: DEFAULT_SERVICE_AREAS_ROUTE.href,
  };
}
