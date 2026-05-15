/**
 * Canonical homepage raster paths (apps/web/public/media).
 * Registry alignment for swaps / QA — see docs/media/NU_STANDARD_MEDIA_ASSET_REGISTRY_V1.md.
 */

export const HOMEPAGE_HERO_IMAGE = {
  /** NSM-HER-002 direction — interior sanctuary / calm premium residential */
  assetId: "NSM-HER-002",
  src: "/media/homepage/hero-nsm-her-002.jpg",
  width: 1536,
  height: 1024,
  alt: "Premium residential living space with soft natural light—orderly, restorative, and materially realistic.",
  sizes: "(max-width: 1024px) 100vw, 42vw",
} as const;

export type HomepageServiceVisualVariant = "deep" | "recurring" | "transition";

export function serviceSlugToHomepageVisualVariant(slug: string): HomepageServiceVisualVariant {
  if (slug === "deep-cleaning") return "deep";
  if (slug === "recurring-home-cleaning") return "recurring";
  return "transition";
}

type ServiceImageMeta = {
  src: string;
  width: number;
  height: number;
  alt: string;
  assetId: string;
};

export function getHomepageServiceImage(slug: string): ServiceImageMeta | null {
  switch (slug) {
    case "deep-cleaning":
      return {
        assetId: "NSM-ENV-001",
        src: "/media/services/deep-cleaning.jpg",
        width: 960,
        height: 640,
        alt: "Calm kitchen environment—realistic premium residential surfaces suited to deep cleaning visits.",
      };
    case "recurring-home-cleaning":
      return {
        assetId: "NSM-ENV-004",
        src: "/media/services/recurring-cleaning.jpg",
        width: 960,
        height: 640,
        alt: "Serene bedroom atmosphere illustrating restorative recurring cleaning rhythm.",
      };
    case "move-in-move-out":
      return {
        assetId: "NSM-ENV-003",
        src: "/media/services/move-transition.jpg",
        width: 960,
        height: 640,
        alt: "Orderly residential entryway—transition-ready presentation for move-in or move-out cleaning.",
      };
    default:
      return null;
  }
}

export type HomepageTrustVisual = {
  assetId: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  headline: string;
  caption: string;
};

/** Owner-operator trust lane — NSM-OOP-001 … OOP-004 directions */
export const HOMEPAGE_TRUST_VISUALS: HomepageTrustVisual[] = [
  {
    assetId: "NSM-OOP-001",
    src: "/media/trust/oop-respectful-entry.jpg",
    width: 880,
    height: 586,
    alt: "Professional arriving respectfully at a residential entrance—prepared, calm, owner-led accountability.",
    headline: "Respectful entry",
    caption: "Prepared teams and considerate arrivals—not rushed drop-ins.",
  },
  {
    assetId: "NSM-OOP-002",
    src: "/media/trust/oop-walkthrough.jpg",
    width: 880,
    height: 586,
    alt: "Collaborative in-home walkthrough with clipboard—listening posture and operational clarity.",
    headline: "Collaborative walkthrough",
    caption: "Scope stays aligned through calm, explicit coordination.",
  },
  {
    assetId: "NSM-OOP-004",
    src: "/media/trust/oop-quality-inspection.jpg",
    width: 880,
    height: 586,
    alt: "Focused quality inspection of residential surfaces—standards-led finishing discipline.",
    headline: "Quality inspection",
    caption: "Visible accountability before your space is handed back.",
  },
];
