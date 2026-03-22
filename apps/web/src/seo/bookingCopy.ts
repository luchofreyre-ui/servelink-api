/**
 * Centralized booking page copy. Use on /book.
 */

export function getBookingPageHeading(
  serviceName?: string,
  locationName?: string
): string {
  if (serviceName && locationName) return `Book ${serviceName} in ${locationName}`;
  if (serviceName) return `Book ${serviceName}`;
  return "Book Cleaning Services";
}

export function getBookingPageIntro(): string {
  return "Choose your service details to continue through the booking flow.";
}
