import type { ServiceSlug } from "../seo/seoConfig";

export type ServiceContent = {
  slug: ServiceSlug;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  includes: string[];
  faq: { question: string; answer: string }[];
};

const HOUSE_CLEANING: ServiceContent = {
  slug: "house-cleaning",
  heroTitle: "House Cleaning",
  heroSubtitle: "Regular cleaning to keep your home fresh and tidy.",
  intro: "Our house cleaning service covers the essentials: dusting, vacuuming, mopping, bathrooms, and kitchens. We focus on consistent results so your home stays clean between visits.",
  includes: [
    "Dusting surfaces and furniture",
    "Vacuuming and mopping floors",
    "Bathroom sanitization",
    "Kitchen cleaning including counters and sink",
    "Trash removal and liner replacement",
    "Making beds and tidying",
    "Straightening common areas",
  ],
  faq: [
    { question: "How long does this service usually take?", answer: "A typical house cleaning visit takes 2–4 hours depending on home size and condition. We'll give you a clearer estimate when you book." },
    { question: "Do cleaners bring supplies?", answer: "Yes. We bring standard cleaning supplies and equipment. If you prefer specific products, you can leave them out and we'll use those." },
    { question: "How do I book this service?", answer: "Use the booking flow on this site to pick a date and time. You'll get a confirmation and we'll show up at the scheduled time." },
  ],
};

const DEEP_CLEANING: ServiceContent = {
  slug: "deep-cleaning",
  heroTitle: "Deep Cleaning",
  heroSubtitle: "Thorough cleaning for a reset or before/after a big change.",
  intro: "Deep cleaning goes beyond routine upkeep. We tackle baseboards, inside appliances, grout, and built-up dirt so your space feels fully refreshed.",
  includes: [
    "All standard house cleaning tasks",
    "Baseboards and detailed dusting",
    "Inside microwave and oven (exterior)",
    "Bathroom grout and tile cleaning",
    "Behind and under movable furniture",
    "Window sills and interior windows",
    "Light fixtures and ceiling fans",
  ],
  faq: [
    { question: "How long does this service usually take?", answer: "Deep cleans usually take half a day to a full day depending on the size of the home and level of detail required." },
    { question: "Do cleaners bring supplies?", answer: "Yes. We bring heavy-duty cleaning supplies suitable for deep cleaning. You can specify any preferred products when booking." },
    { question: "How do I book this service?", answer: "Select deep cleaning in the booking flow, choose your date, and complete the request. We'll confirm and arrive at the scheduled time." },
  ],
};

const MOVE_OUT: ServiceContent = {
  slug: "move-out-cleaning",
  heroTitle: "Move-Out Cleaning",
  heroSubtitle: "Leave your space clean and ready for the next occupant.",
  intro: "Move-out cleaning ensures the property is left in great condition. We clean cabinets, appliances, floors, and bathrooms so it's ready for handover or the next tenant.",
  includes: [
    "Full interior cleaning room by room",
    "Inside cabinets and drawers",
    "Inside refrigerator and oven",
    "Bathrooms and kitchen deep clean",
    "Floors vacuumed and mopped",
    "Removal of cleaning-related debris",
    "Final walk-through check",
  ],
  faq: [
    { question: "How long does this service usually take?", answer: "Move-out cleans typically take 4–8 hours depending on the size and condition of the property." },
    { question: "Do cleaners bring supplies?", answer: "Yes. We bring all necessary cleaning supplies and equipment for a thorough move-out clean." },
    { question: "How do I book this service?", answer: "Choose move-out cleaning in the booking flow, enter the address and preferred date, and we'll confirm and perform the clean." },
  ],
};

const RECURRING: ServiceContent = {
  slug: "recurring-cleaning",
  heroTitle: "Recurring Cleaning",
  heroSubtitle: "Scheduled cleanings that fit your routine.",
  intro: "Set a regular schedule—weekly, biweekly, or monthly—and we'll keep your home consistently clean. Same team when possible for continuity.",
  includes: [
    "All standard house cleaning tasks",
    "Scheduled on a recurring basis",
    "Consistent checklist each visit",
    "Flexibility to reschedule when needed",
    "Same crew when possible",
    "No long-term contract required",
    "Easy pause or cancel",
  ],
  faq: [
    { question: "How long does this service usually take?", answer: "Recurring visits usually take 2–4 hours per visit, similar to a one-time house cleaning, depending on home size." },
    { question: "Do cleaners bring supplies?", answer: "Yes. We bring standard supplies for each recurring visit. You can request specific products if needed." },
    { question: "How do I book this service?", answer: "Select recurring cleaning in the booking flow, choose your frequency and start date, and we'll set up your schedule." },
  ],
};

const AIRBNB: ServiceContent = {
  slug: "airbnb-cleaning",
  heroTitle: "Airbnb Cleaning",
  heroSubtitle: "Turnover cleaning for short-term rentals.",
  intro: "We clean between guests so your listing is ready on time. Bathrooms, linens, floors, and common areas are handled so you can focus on hosting.",
  includes: [
    "Full clean between guest stays",
    "Bathroom sanitization",
    "Linen and towel handling",
    "Kitchen and appliance wipe-down",
    "Floors and common areas",
    "Trash and recycling removal",
    "Restocking basics if requested",
  ],
  faq: [
    { question: "How long does this service usually take?", answer: "Turnover cleans typically take 2–4 hours depending on the size of the unit and what's included (e.g. linens)." },
    { question: "Do cleaners bring supplies?", answer: "Yes. We bring cleaning supplies. You can provide linens or other items if you prefer to supply them." },
    { question: "How do I book this service?", answer: "Book Airbnb cleaning in the booking flow and provide your turnover schedule. We'll confirm and clean between guests." },
  ],
};

export const SERVICE_CONTENT: ServiceContent[] = [
  HOUSE_CLEANING,
  DEEP_CLEANING,
  MOVE_OUT,
  RECURRING,
  AIRBNB,
];

export function getServiceContentBySlug(slug: string): ServiceContent | null {
  return SERVICE_CONTENT.find((c) => c.slug === slug) ?? null;
}
