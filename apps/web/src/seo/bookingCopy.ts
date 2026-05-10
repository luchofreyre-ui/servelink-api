/**
 * Centralized booking page copy. Use on /book.
 */

export function getBookingPageHeading(
  serviceName?: string,
  locationName?: string,
): string {
  if (serviceName && locationName) return `Book ${serviceName} in ${locationName}`;
  if (serviceName) return `Book ${serviceName}`;
  return "Book Cleaning Services";
}

export function getBookingPageIntro(): string {
  return "Choose your service, walk through home details with guided clarity, then continue to teams and timing when you’re ready.";
}

/** Hero eyebrow on the public booking flow (not meta). */
export const BOOKING_FLOW_HERO_EYEBROW = "Guided booking";

/** Primary headline on /book. */
export const BOOKING_FLOW_HERO_HEADLINE =
  "Shape your cleaning plan in calm, precise steps.";

/** Supporting line under the hero headline. */
export const BOOKING_FLOW_HERO_BODY =
  "Tell us about your home and how you like timing handled. When a live preview is available, you’ll review figures before anything is finalized—otherwise our team follows up with clear pricing context.";
