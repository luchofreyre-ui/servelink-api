import type { PublicServiceEntry } from "./publicContentRegistry";
import { getAllServiceEntries, getAllArticleEntries } from "./publicContentSelectors";

const HOMEPAGE_SERVICE_SLUG_ORDER = [
  "deep-cleaning",
  "first-time-clean-with-recurring-services",
  "recurring-home-cleaning",
  "move-in-move-out",
] as const;

export type HomepageFeaturedService = PublicServiceEntry & {
  displaySlug: string;
  displayTitle: string;
  displayDescription: string;
  displayBadge: string;
  serviceHref: string;
  bookingHref: string;
  mediaSlug: PublicServiceEntry["slug"];
};

function toHomepageFeaturedService(
  service: PublicServiceEntry,
  overrides: Partial<HomepageFeaturedService> = {},
): HomepageFeaturedService {
  return {
    ...service,
    displaySlug: service.slug,
    displayTitle: service.title,
    displayDescription: service.shortDescription,
    displayBadge: service.serviceBadge,
    serviceHref: `/services/${service.slug}`,
    bookingHref: `/book?service=${service.slug}`,
    mediaSlug: service.slug,
    ...overrides,
  };
}

/** Homepage cards include a presentation-only first-time recurring path without adding a new route. */
export function getHomepageFeaturedServicesOrdered(): HomepageFeaturedService[] {
  const all = getAllServiceEntries();
  const deepClean = all.find((s) => s.slug === "deep-cleaning");
  const recurring = all.find((s) => s.slug === "recurring-home-cleaning");
  const moveOut = all.find((s) => s.slug === "move-in-move-out");

  const featured = [
    deepClean ? toHomepageFeaturedService(deepClean) : null,
    recurring
      ? toHomepageFeaturedService(recurring, {
          displaySlug: "first-time-clean-with-recurring-services",
          displayTitle: "First-time clean with recurring services",
          displayDescription:
            "Start with the right reset, then move into a recurring rhythm that keeps the home easier to maintain.",
          displayBadge: "Best first step for upkeep",
          serviceHref: "/services/recurring-home-cleaning",
          bookingHref: "/book?service=recurring-home-cleaning",
        })
      : null,
    recurring ? toHomepageFeaturedService(recurring) : null,
    moveOut ? toHomepageFeaturedService(moveOut) : null,
  ].filter((s): s is HomepageFeaturedService => Boolean(s));

  return HOMEPAGE_SERVICE_SLUG_ORDER.map((slug) => featured.find((s) => s.displaySlug === slug)).filter(
    (s): s is HomepageFeaturedService => Boolean(s),
  );
}

export function getHomepageFeaturedServices() {
  return getHomepageFeaturedServicesOrdered();
}

export function getHomepageFeaturedArticles() {
  return getAllArticleEntries().slice(0, 2);
}

export function getHomepageTrustPoints() {
  return [
    "Background-checked professionals",
    "Insured service with explicit expectations",
    "Disciplined, respectful in-home conduct",
    "Realistic timing modeled before we arrive",
  ];
}

/** Full-width trust strip below hero (homepage layout). */
export function getHomepageTrustStripItems() {
  return [
    "Owner-led teams",
    "Transparent scheduling",
    "Documented standards",
    "Honest real-time estimate",
    "Satisfaction support",
  ];
}

export function getHomepageStandards() {
  return [
    "Owner-operators accountable on every visit team",
    "Surface-aware methods and disciplined execution",
    "Consistent standards—not whoever was available that day",
    "Clear communication from booking through completion",
  ];
}

export function getHomepageSteps() {
  return [
    {
      step: "01",
      title: "Tell us what you need",
      body: "Share your home profile in guided steps—your estimate updates in real time from the details you share, with clear expectations and no sales call required.",
    },
    {
      step: "02",
      title: "We prepare",
      body: "Your visit is aligned to the right plan and crew expectations before anyone arrives—with accountable coordination so standards stay consistent visit to visit.",
    },
    {
      step: "03",
      title: "We deliver",
      body: "An owner-led team executes with accountable standards you can feel—disciplined, respectful, and focused on the outcome.",
    },
  ];
}

/** Standards-forward proof lane — commitments, not fabricated testimonials. */
export function getHomepageProofSectionIntro() {
  return {
    eyebrow: "Proof we can stand behind",
    title: "Built around accountable service—not anonymous staffing.",
    supportingLine:
      "Documented quality standards, transparent scheduling, and respectful in-home professionalism—operational clarity from booking through completion.",
  };
}

export function getHomepageProofCommitments() {
  return [
    {
      title: "Owner-led accountability",
      body: "Leadership you can recognize—operators personally accountable for how visits are planned, communicated, and completed.",
    },
    {
      title: "Background-checked professionals",
      body: "Vetted professionals trained for disciplined, respectful in-home conduct—not improvised staffing.",
    },
    {
      title: "Clear pricing",
      body: "Transparent scope and pricing signals before you commit—no bait-and-switch choreography.",
    },
    {
      title: "Secure payments",
      body: "Payments handled through established, secure rails—no improvised handling.",
    },
    {
      title: "Satisfaction support",
      body: "When something misses the mark, there is a path to resolution—operations you can reach.",
    },
  ] as const;
}
