/**
 * Migration-only legacy pipeline support.
 * Not part of operational encyclopedia system.
 * Use API-backed review + promotion instead.
 */

import { buildStoredAdminReviewPages } from "./adminPipeline.server";
import { getPublishablePages } from "./publishPipeline";

export function exportPublishedPages() {
  const pages = buildStoredAdminReviewPages();
  return getPublishablePages(pages);
}
