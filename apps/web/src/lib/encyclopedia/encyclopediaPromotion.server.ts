/**
 * Migration-only legacy pipeline support.
 * Not part of operational encyclopedia system.
 * Use API-backed review + promotion instead.
 */

import type { PromoteApprovedOptions } from "./encyclopediaPipelineTypes";
import type { ReviewablePage } from "./renderTypes";

const LEGACY_PROMOTION_REMOVED =
  "Legacy promotion pipeline is migration-only. Use API review promotion.";

export type PromoteApprovedEncyclopediaPageOptions = {
  runId?: string;
  logBlockedGuard?: boolean;
};

export function reviewPageAllowsPipelinePromotion(page: ReviewablePage): boolean {
  if (page.reviewStatus !== "approved") return false;
  if (
    page.repairReadiness !== "ready" &&
    page.editorialOverrideMode !== "force-pass"
  ) {
    return false;
  }
  return true;
}

export function promoteApprovedEncyclopediaPage(
  _slug: string,
  _options?: PromoteApprovedEncyclopediaPageOptions
): never {
  throw new Error(LEGACY_PROMOTION_REMOVED);
}

export function promoteApprovedEncyclopediaPages(
  _options?: PromoteApprovedOptions
): never {
  throw new Error(LEGACY_PROMOTION_REMOVED);
}

export function promoteApprovedEncyclopediaPageAndRevalidate(
  _slug: string
): never {
  throw new Error(LEGACY_PROMOTION_REMOVED);
}

export function promoteApprovedEncyclopediaPagesAndRevalidate(
  _options?: PromoteApprovedOptions
): never {
  throw new Error(LEGACY_PROMOTION_REMOVED);
}
