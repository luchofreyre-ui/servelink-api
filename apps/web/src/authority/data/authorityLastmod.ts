/**
 * Single authority-system lastmod control point.
 *
 * Update this value whenever authority content structure materially changes.
 * Keep ISO date format YYYY-MM-DD.
 */
export const AUTHORITY_LASTMOD_DATE = "2026-03-23";

export function getAuthorityLastmodDate(): string {
  return AUTHORITY_LASTMOD_DATE;
}
