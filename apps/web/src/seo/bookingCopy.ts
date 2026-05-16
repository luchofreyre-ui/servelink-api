/**
 * Centralized booking page copy. Use on /book.
 */

import { NU_STANDARD_OWNER_OPERATOR_ANCHOR } from "@/components/marketing/precision-luxury/content/nuStandardTrustPositioning";

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
export const BOOKING_FLOW_HERO_EYEBROW = "Nu Standard · Book online";

/** Primary headline on /book. */
export const BOOKING_FLOW_HERO_HEADLINE = "Tell us about your home.";

/** Supporting line under the hero headline. */
export const BOOKING_FLOW_HERO_BODY =
  "A few details help us create an accurate estimate.";

export const BOOKING_FLOW_HERO_BULLET_ACCURATE_PRICING = "Accurate pricing";

export const BOOKING_FLOW_HERO_BULLET_CLEAR_EXPECTATIONS = "Clear expectations";

export const BOOKING_FLOW_HERO_BULLET_EASY_PROCESS = "Easy, stress-free process";

export const BOOKING_FLOW_HERO_REALTIME_LINE =
  "Your estimate updates in real time from the details you share—no sales call required.";

export const BOOKING_FLOW_HERO_CLEAR_NUMBERS_LINE = "Clear numbers first. Prepared service second.";

export const BOOKING_FLOW_HERO_NO_PRESSURE_LINE =
  "No pushy quote calls. No vague price games.";

/** Owner-operator accountability anchor — full sentence under hero body on `/book`. */
export const BOOKING_FLOW_HERO_ACCOUNTABILITY = NU_STANDARD_OWNER_OPERATOR_ANCHOR;

/** Operational transparency — retained for secondary reassurance below bullets */
export const BOOKING_FLOW_HERO_OPERATIONAL_TRANSPARENCY =
  "Transparent scheduling, documented standards, and respectful coordination through confirmation.";
