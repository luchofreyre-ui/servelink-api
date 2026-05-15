import type { PublicServiceEntry } from "./publicContentRegistry";
import { getAllServiceEntries, getAllArticleEntries } from "./publicContentSelectors";

const HOMEPAGE_SERVICE_SLUG_ORDER = [
  "deep-cleaning",
  "recurring-home-cleaning",
  "move-in-move-out",
] as const;

/** Deep, recurring, and transition cleaning — registry has no separate “standard” service slug. */
export function getHomepageFeaturedServicesOrdered(): PublicServiceEntry[] {
  const all = getAllServiceEntries();
  return HOMEPAGE_SERVICE_SLUG_ORDER.map((slug) => all.find((s) => s.slug === slug)).filter(
    (s): s is PublicServiceEntry => Boolean(s),
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
    "Transparent scheduling",
    "Background-checked professionals",
    "Clear pricing",
    "Secure payments",
    "Owner-led accountability",
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
      title: "Book in minutes",
      body: "Share your home profile and preferences in a guided flow—clear questions, no guesswork, and timing that reflects real availability.",
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
      "Documented quality standards, transparent scheduling, and respectful in-home professionalism—calm operational clarity from booking through completion.",
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
