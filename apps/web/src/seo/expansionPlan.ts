/**
 * Locked system-definition file for future expansion. Not for runtime logic.
 */

export const CURRENT_CITY_SLUGS = ["tulsa", "broken-arrow", "bixby"] as const;

export const CURRENT_NEIGHBORHOOD_SLUGS = [
  "brookside-tulsa",
  "downtown-tulsa",
  "cherry-street-tulsa",
] as const;

export const PROGRAMMATIC_EXPANSION_RULES = {
  cityPages:
    "Pure location landing pages for each seeded city; add new cities only via LOCATION_DEFINITIONS and content.",
  neighborhoodPages:
    "Pure location landing pages for each seeded neighborhood; add new neighborhoods only via LOCATION_DEFINITIONS and content.",
  serviceLocationPages:
    "Service/location combinations are generated from SERVICE_DEFINITIONS × LOCATION_DEFINITIONS; no ad hoc routes.",
  metadata:
    "All page metadata is built via helpers in metadata.ts; do not duplicate title/description logic in pages.",
  schema:
    "All JSON-LD schema is assembled via schemaSets.ts; use buildProviderReference and breadcrumb helpers for consistency.",
  internalLinking:
    "Related links and labels come from relatedLinks.ts and linkLabels.ts; keep deterministic from seeded definitions only.",
} as const;
