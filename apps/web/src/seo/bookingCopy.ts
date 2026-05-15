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
  return "Choose your visit type, tell us about your home at your pace, then meet your team and pick a time when you’re ready.";
}

/** Hero eyebrow on the public booking flow (not meta). */
export const BOOKING_FLOW_HERO_EYEBROW = "Nu Standard · Reserve online";

/** Primary headline on /book. */
export const BOOKING_FLOW_HERO_HEADLINE =
  "Book your cleaning visit with calm, concierge-level clarity.";

/** Supporting line under the hero headline. */
export const BOOKING_FLOW_HERO_BODY =
  "Walk through a few thoughtful questions about your home. When we can show pricing here, you’ll review it before checkout—otherwise Nu Standard replies personally with numbers that match what you shared.";
