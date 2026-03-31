/**
 * Legacy pipeline: promotes from the **file-backed** review corpus. Operational promote/retry runs via the API admin review endpoints.
 */
import { promoteApprovedEncyclopediaPagesAndRevalidate } from "./lib/migration/legacyEncyclopediaPromotion.server";

console.warn(
  "[legacy pipeline] promote-approved-pipeline.ts is legacy-only. Operational approval/promotion now runs through the API-backed encyclopedia review system.",
);

const result = promoteApprovedEncyclopediaPagesAndRevalidate();
console.log(result);
