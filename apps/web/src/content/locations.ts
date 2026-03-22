import type { LocationSlug } from "../seo/seoConfig";

export type LocationFaqItem = { question: string; answer: string };

export type LocationContent = {
  slug: LocationSlug;
  displayName: string;
  type: "city" | "neighborhood";
  intro: string;
  serviceAreaSummary: string;
  faq: LocationFaqItem[];
};

const LOCATION_FAQ: LocationFaqItem[] = [
  {
    question: "What cleaning services are available in this area?",
    answer:
      "House cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning are available. Each service has a dedicated page for this area with booking.",
  },
  {
    question: "How do I book cleaning in this area?",
    answer:
      "Use the Book now button on any service page for this area, or go to the booking flow and select this area when prompted.",
  },
  {
    question: "Do I see availability during booking?",
    answer: "Yes. Availability is shown during the booking process after you enter your details and select your service.",
  },
];

const LOCATION_EXTRA_FAQ: Record<string, LocationFaqItem[]> = {
  tulsa: [
    { question: "How do I book house cleaning in Tulsa?", answer: "Use the Book now button on any Tulsa service page or go to the booking flow and select Tulsa as your area. You'll see availability and complete your request there." },
  ],
  "broken-arrow": [
    { question: "Do you service homes in Broken Arrow?", answer: "Yes. Broken Arrow is part of our Tulsa-area coverage. You can book house cleaning, deep cleaning, move-out cleaning, and recurring cleaning for Broken Arrow through this site." },
  ],
  bixby: [
    { question: "How far outside Tulsa do cleaners travel?", answer: "We serve Tulsa and surrounding areas including Bixby. Service area is confirmed during booking based on your address." },
  ],
  "brookside-tulsa": [
    { question: "Do you service homes in Brookside Tulsa?", answer: "Yes. Brookside is part of our Tulsa service area. Book any cleaning service and select your area to see availability for Brookside." },
  ],
  "downtown-tulsa": [
    { question: "Do you clean homes in Downtown Tulsa?", answer: "Yes. Downtown Tulsa is within our coverage area. Use the booking flow and select your location to schedule cleaning." },
  ],
  "cherry-street-tulsa": [
    { question: "Is Cherry Street included in your service area?", answer: "Yes. Cherry Street in Tulsa is covered. Book through any service page and choose your area to see availability." },
  ],
};

export const LOCATION_CONTENT: LocationContent[] = [
  {
    slug: "tulsa",
    displayName: "Tulsa",
    type: "city",
    intro: "Nu Standard Cleaning serves Tulsa with house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb turnover cleaning.",
    serviceAreaSummary: "We cover Tulsa and work with local teams to provide reliable cleaning services across the area.",
    faq: [...LOCATION_FAQ, ...(LOCATION_EXTRA_FAQ.tulsa ?? [])],
  },
  {
    slug: "broken-arrow",
    displayName: "Broken Arrow",
    type: "city",
    intro: "Nu Standard Cleaning offers cleaning services in Broken Arrow, including house cleaning, deep cleaning, move-out cleaning, and recurring cleaning.",
    serviceAreaSummary: "Broken Arrow is part of our Tulsa-area service coverage.",
    faq: [...LOCATION_FAQ, ...(LOCATION_EXTRA_FAQ["broken-arrow"] ?? [])],
  },
  {
    slug: "bixby",
    displayName: "Bixby",
    type: "city",
    intro: "Nu Standard Cleaning serves Bixby with house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning.",
    serviceAreaSummary: "Bixby is included in our Tulsa-area service area.",
    faq: [...LOCATION_FAQ, ...(LOCATION_EXTRA_FAQ.bixby ?? [])],
  },
  {
    slug: "brookside-tulsa",
    displayName: "Brookside",
    type: "neighborhood",
    intro: "Brookside in Tulsa is part of our service area. We offer house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning here.",
    serviceAreaSummary: "Brookside is covered as part of our Tulsa service area.",
    faq: [...LOCATION_FAQ, ...(LOCATION_EXTRA_FAQ["brookside-tulsa"] ?? [])],
  },
  {
    slug: "downtown-tulsa",
    displayName: "Downtown Tulsa",
    type: "neighborhood",
    intro: "Downtown Tulsa is served by Nu Standard Cleaning. We provide house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb turnover cleaning.",
    serviceAreaSummary: "Downtown Tulsa is within our Tulsa-area coverage.",
    faq: [...LOCATION_FAQ, ...(LOCATION_EXTRA_FAQ["downtown-tulsa"] ?? [])],
  },
  {
    slug: "cherry-street-tulsa",
    displayName: "Cherry Street",
    type: "neighborhood",
    intro: "Cherry Street in Tulsa is part of our service area. We offer house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning.",
    serviceAreaSummary: "Cherry Street is covered as part of our Tulsa service area.",
    faq: [...LOCATION_FAQ, ...(LOCATION_EXTRA_FAQ["cherry-street-tulsa"] ?? [])],
  },
];

export function getLocationContentBySlug(slug: string): LocationContent | null {
  return LOCATION_CONTENT.find((c) => c.slug === slug) ?? null;
}
