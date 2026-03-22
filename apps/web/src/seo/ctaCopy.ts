/**
 * Centralized booking CTA copy. All booking CTA sections must use these helpers.
 */

export type BookingCtaCopy = {
  title: string;
  description: string;
  label: string;
};

const LABEL = "Book now";

export function getHomepageBookingCta(): BookingCtaCopy {
  return {
    title: "Book cleaning services",
    description: "Choose your service and area to see availability and complete your booking.",
    label: LABEL,
  };
}

export function getServiceBookingCta(serviceName: string): BookingCtaCopy {
  return {
    title: `Book ${serviceName}`,
    description: "Select your options and complete your booking for this service.",
    label: LABEL,
  };
}

export function getServiceLocationBookingCta(
  serviceName: string,
  locationName: string
): BookingCtaCopy {
  return {
    title: `Book ${serviceName} in ${locationName}`,
    description: "Complete your booking for this service in your area.",
    label: LABEL,
  };
}

export function getLocationBookingCta(locationName: string): BookingCtaCopy {
  return {
    title: `Book cleaning services in ${locationName}`,
    description: "Choose your service to see availability and complete your booking in this area.",
    label: LABEL,
  };
}
