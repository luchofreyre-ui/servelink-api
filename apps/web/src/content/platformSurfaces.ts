export type TrustSignals = {
  homesServedLabel: string;
  ratingLabel: string;
  coverageLabel: string;
};

export type PricingSurface = {
  priceRangeLabel: string;
};

export type AvailabilitySurface = {
  nextAvailabilityLabel: string;
};

/**
 * Approved platform-content surface. This pass returns static fallbacks only.
 * Replace with live API calls when platform data is available.
 */
export function getServiceTrustSignals(
  _serviceSlug: string,
  _locationSlug?: string
): TrustSignals {
  return {
    homesServedLabel: "Locally operated cleaning support",
    ratingLabel: "Quality-focused service standards",
    coverageLabel: "Service coverage across Tulsa-area locations",
  };
}

/**
 * Approved platform-content surface. This pass returns static fallbacks only.
 */
export function getServicePricingSurface(
  _serviceSlug: string,
  _locationSlug?: string
): PricingSurface {
  return {
    priceRangeLabel: "Pricing varies by home size, condition, and service level",
  };
}

/**
 * Approved platform-content surface. This pass returns static fallbacks only.
 */
export function getServiceAvailabilitySurface(
  _serviceSlug: string,
  _locationSlug?: string
): AvailabilitySurface {
  return {
    nextAvailabilityLabel: "Availability shown during booking",
  };
}
