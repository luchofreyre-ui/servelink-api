import type { KnownCitySlug, LocationContext } from "./locationTypes";

const KNOWN_CITY_SLUGS: KnownCitySlug[] = [
  "tulsa-ok",
  "broken-arrow-ok",
  "jenks-ok",
  "bixby-ok",
];

function findKnownCitySlug(pathname: string): KnownCitySlug | undefined {
  for (const citySlug of KNOWN_CITY_SLUGS) {
    if (pathname.includes(`/${citySlug}`)) {
      return citySlug;
    }
  }

  return undefined;
}

function cityLabelForSlug(citySlug: KnownCitySlug): string {
  switch (citySlug) {
    case "tulsa-ok":
      return "Tulsa, OK";
    case "broken-arrow-ok":
      return "Broken Arrow, OK";
    case "jenks-ok":
      return "Jenks, OK";
    case "bixby-ok":
      return "Bixby, OK";
    default:
      return "Tulsa Metro";
  }
}

export function resolveLocationContext(pathname: string): LocationContext {
  const citySlug = findKnownCitySlug(pathname);

  if (citySlug) {
    return {
      citySlug,
      cityLabel: cityLabelForSlug(citySlug),
      source: "pathname",
    };
  }

  return {
    citySlug: "tulsa-ok",
    cityLabel: "Tulsa, OK",
    source: "default",
  };
}
