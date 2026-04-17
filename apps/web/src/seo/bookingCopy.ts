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
  return "Choose your service, add a few home details, and pick a preferred schedule.";
}

/** Hero eyebrow on the public booking flow (not meta). */
export const BOOKING_FLOW_HERO_EYEBROW = "Book a cleaning";

/** Primary headline on /book. */
export const BOOKING_FLOW_HERO_HEADLINE =
  "Request your cleaning in a few clear steps.";

/** Supporting line under the hero headline. */
export const BOOKING_FLOW_HERO_BODY =
  "Tell us about your home and timing. When we can run a preview, you’ll see it before you send your request—otherwise we follow up with a quote.";
