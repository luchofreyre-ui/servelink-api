/**
 * Service comparison content for ranking comparison queries (e.g. "deep cleaning vs house cleaning").
 */

export type ServiceComparison = {
  title: string;
  description: string;
  serviceSlugA: string;
  serviceSlugB: string;
  labelA: string;
  labelB: string;
};

export const SERVICE_COMPARISONS: ServiceComparison[] = [
  {
    title: "Deep cleaning vs regular house cleaning",
    description:
      "House cleaning covers routine upkeep: dusting, vacuuming, bathrooms, and kitchens. Deep cleaning adds detailed work like baseboards, inside appliances, grout, and behind furniture. Choose house cleaning for ongoing maintenance and deep cleaning for a reset or before/after a move.",
    serviceSlugA: "house-cleaning",
    serviceSlugB: "deep-cleaning",
    labelA: "House Cleaning",
    labelB: "Deep Cleaning",
  },
  {
    title: "Move-out cleaning vs recurring cleaning",
    description:
      "Recurring cleaning keeps your home consistently tidy on a schedule you set. Move-out cleaning is a one-time thorough clean for when you're leaving a property, often required by landlords. Both include detailed attention to the space; move-out focuses on turnover readiness.",
    serviceSlugA: "recurring-cleaning",
    serviceSlugB: "move-out-cleaning",
    labelA: "Recurring Cleaning",
    labelB: "Move-Out Cleaning",
  },
];
