export const SITE_NAME = "Nu Standard Cleaning";
export const SITE_URL = "https://nustandardcleaning.com";
export const DEFAULT_TITLE = "Nu Standard Cleaning";
export const DEFAULT_DESCRIPTION =
  "Professional house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning in Tulsa and surrounding areas.";

export const SERVICE_DEFINITIONS = [
  { slug: "house-cleaning", name: "House Cleaning", shortName: "House Cleaning" },
  { slug: "deep-cleaning", name: "Deep Cleaning", shortName: "Deep Cleaning" },
  { slug: "move-out-cleaning", name: "Move-Out Cleaning", shortName: "Move-Out Cleaning" },
  { slug: "recurring-cleaning", name: "Recurring Cleaning", shortName: "Recurring Cleaning" },
  { slug: "airbnb-cleaning", name: "Airbnb Cleaning", shortName: "Airbnb Cleaning" },
] as const;

export const LOCATION_DEFINITIONS = [
  { slug: "tulsa", name: "Tulsa", type: "city", stateCode: "OK" },
  { slug: "broken-arrow", name: "Broken Arrow", type: "city", stateCode: "OK" },
  { slug: "bixby", name: "Bixby", type: "city", stateCode: "OK" },
  { slug: "brookside-tulsa", name: "Brookside", parentCity: "Tulsa", type: "neighborhood", stateCode: "OK" },
  { slug: "downtown-tulsa", name: "Downtown Tulsa", parentCity: "Tulsa", type: "neighborhood", stateCode: "OK" },
  { slug: "cherry-street-tulsa", name: "Cherry Street", parentCity: "Tulsa", type: "neighborhood", stateCode: "OK" },
] as const;

/** City slugs that have a keyword-rich area landing page at /{slug}-cleaning-services */
export const AREA_PAGE_CITY_SLUGS = ["tulsa", "broken-arrow", "bixby"] as const;
export const AREA_PAGE_SUFFIX = "-cleaning-services";

export type ServiceSlug = (typeof SERVICE_DEFINITIONS)[number]["slug"];
export type LocationSlug = (typeof LOCATION_DEFINITIONS)[number]["slug"];
export type ServiceDefinition = (typeof SERVICE_DEFINITIONS)[number];
export type LocationDefinition = (typeof LOCATION_DEFINITIONS)[number];
