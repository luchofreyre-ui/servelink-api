import type { IntentRule, IntentServiceRoute, IntentServiceSlug } from "./intentCtaTypes";

export const DEFAULT_SERVICE_AREAS_ROUTE: IntentServiceRoute = {
  serviceSlug: "grout-cleaning",
  href: "/service-areas",
  title: "Browse Service Areas",
};

export const INTENT_SERVICE_PRIORITY: IntentServiceSlug[] = [
  "shower-cleaning",
  "grout-cleaning",
  "glass-and-detail-cleaning",
  "hard-surface-floor-cleaning",
];

export const LOCALIZED_SERVICE_ROUTES: IntentServiceRoute[] = [
  {
    serviceSlug: "grout-cleaning",
    citySlug: "tulsa-ok",
    href: "/services/grout-cleaning/tulsa-ok",
    title: "Grout Cleaning in Tulsa, OK",
  },
  {
    serviceSlug: "grout-cleaning",
    citySlug: "broken-arrow-ok",
    href: "/services/grout-cleaning/broken-arrow-ok",
    title: "Grout Cleaning in Broken Arrow, OK",
  },
  {
    serviceSlug: "shower-cleaning",
    citySlug: "tulsa-ok",
    href: "/services/shower-cleaning/tulsa-ok",
    title: "Shower Cleaning in Tulsa, OK",
  },
  {
    serviceSlug: "shower-cleaning",
    citySlug: "jenks-ok",
    href: "/services/shower-cleaning/jenks-ok",
    title: "Shower Cleaning in Jenks, OK",
  },
  {
    serviceSlug: "glass-and-detail-cleaning",
    citySlug: "tulsa-ok",
    href: "/services/glass-and-detail-cleaning/tulsa-ok",
    title: "Glass and Detail Cleaning in Tulsa, OK",
  },
  {
    serviceSlug: "glass-and-detail-cleaning",
    citySlug: "jenks-ok",
    href: "/services/glass-and-detail-cleaning/jenks-ok",
    title: "Glass and Detail Cleaning in Jenks, OK",
  },
  {
    serviceSlug: "hard-surface-floor-cleaning",
    citySlug: "tulsa-ok",
    href: "/services/hard-surface-floor-cleaning/tulsa-ok",
    title: "Hard Surface Floor Cleaning in Tulsa, OK",
  },
  {
    serviceSlug: "hard-surface-floor-cleaning",
    citySlug: "bixby-ok",
    href: "/services/hard-surface-floor-cleaning/bixby-ok",
    title: "Hard Surface Floor Cleaning in Bixby, OK",
  },
];

export const INTENT_RULES: IntentRule[] = [
  {
    id: "wet-area-residue",
    title: "Wet-area cleaning help",
    description:
      "Best next step for shower, soap scum, hard-water, and mildew related topics.",
    serviceSlug: "shower-cleaning",
    matches: {
      problemSlugs: ["soap-scum", "hard-water-stains", "mildew"],
      surfaceSlugs: ["glass", "grout", "ceramic-tile", "porcelain-tile", "chrome"],
      methodSlugs: ["oxidizing-cleaners", "moisture-reduction", "neutral-cleaners"],
      toolSlugs: ["squeegee", "non-scratch-scrub-pad", "detail-brush"],
      articleSlugs: [
        "how-to-clean-shower",
        "how-to-remove-soap-scum",
        "how-to-remove-hard-water-stains",
        "how-to-remove-bathroom-mildew",
      ],
      clusterSlugs: ["bathroom-wet-area-cleaning"],
    },
  },
  {
    id: "grout-and-tile",
    title: "Grout and tile cleaning help",
    description:
      "Best next step for grout lines, tile soils, and residue trapped in textured mineral surfaces.",
    serviceSlug: "grout-cleaning",
    matches: {
      problemSlugs: ["grout-soiling", "soap-scum", "hard-water-stains"],
      surfaceSlugs: ["grout", "ceramic-tile", "porcelain-tile"],
      methodSlugs: ["mechanical-agitation", "acid-cleaners", "neutral-cleaners"],
      toolSlugs: ["grout-brush", "detail-brush", "microfiber-towel"],
      articleSlugs: ["how-to-clean-grout", "how-to-clean-tile"],
      clusterSlugs: ["grout-and-tile-cleaning"],
    },
  },
  {
    id: "glass-and-detail",
    title: "Glass and detail cleaning help",
    description:
      "Best next step for glass, smudges, hard-water haze, and detail-cleaning intent.",
    serviceSlug: "glass-and-detail-cleaning",
    matches: {
      problemSlugs: ["hard-water-stains", "soap-scum"],
      surfaceSlugs: ["glass", "chrome"],
      methodSlugs: ["microfiber-cleaning", "neutral-cleaners"],
      toolSlugs: ["squeegee", "microfiber-towel"],
      articleSlugs: ["how-to-clean-windows", "how-to-remove-hard-water-stains"],
      clusterSlugs: ["glass-and-detail-cleaning-guides"],
    },
  },
  {
    id: "hard-surface-floors",
    title: "Hard-surface floor cleaning help",
    description:
      "Best next step for laminate, floor soils, tracked-in residue, and routine finish-safe cleaning.",
    serviceSlug: "hard-surface-floor-cleaning",
    matches: {
      problemSlugs: ["kitchen-grease", "grout-soiling"],
      surfaceSlugs: ["laminate", "ceramic-tile", "porcelain-tile"],
      methodSlugs: ["microfiber-cleaning", "neutral-cleaners", "mechanical-agitation"],
      toolSlugs: ["mop-pad", "microfiber-towel"],
      articleSlugs: ["how-to-clean-laminate-floors", "how-to-clean-tile"],
      clusterSlugs: ["floor-cleaning-guides"],
    },
  },
];
