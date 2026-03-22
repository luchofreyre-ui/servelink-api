/**
 * Consistent page titles for hero sections and related headings.
 */

export function getServicePageTitle(serviceName: string): string {
  return serviceName;
}

export function getLocationPageTitle(locationName: string): string {
  return `${locationName} Cleaning Services`;
}

export function getServiceLocationPageTitle(serviceName: string, locationName: string): string {
  return `${serviceName} in ${locationName}`;
}
