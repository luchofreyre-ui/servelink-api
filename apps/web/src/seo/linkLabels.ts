/**
 * Consistent link labels for related links and breadcrumbs. Use when building related link data.
 */

export function getServiceLinkLabel(serviceName: string): string {
  return serviceName;
}

export function getLocationLinkLabel(locationName: string): string {
  return `${locationName} Cleaning Services`;
}

export function getServiceLocationLinkLabel(serviceName: string, locationName: string): string {
  return `${serviceName} in ${locationName}`;
}
