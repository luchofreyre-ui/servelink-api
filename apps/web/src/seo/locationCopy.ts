/**
 * Centralized location page copy. Use in LocationPage so future expansion does not duplicate logic.
 */

export function getLocationHeroSubtitle(
  _locationName: string,
  serviceAreaSummary: string
): string {
  return serviceAreaSummary;
}

export function getLocationPageIntro(locationIntro: string): string {
  return locationIntro;
}
