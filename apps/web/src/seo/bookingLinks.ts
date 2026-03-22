const BOOKING_BASE_PATH = "/book";

/**
 * Booking entry path. If service/location are present, append as query params.
 * Examples: /book?service=house-cleaning , /book?service=house-cleaning&location=tulsa
 */
export function getBookingHref(serviceSlug?: string, locationSlug?: string): string {
  const params = new URLSearchParams();
  if (serviceSlug) params.set("service", serviceSlug);
  if (locationSlug) params.set("location", locationSlug);
  const qs = params.toString();
  return qs ? `${BOOKING_BASE_PATH}?${qs}` : BOOKING_BASE_PATH;
}
