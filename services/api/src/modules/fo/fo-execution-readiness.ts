/**
 * Execution readiness: provider linkage required for dispatch (`DispatchCandidateService`)
 * and consistent operational identity. Separate from `evaluateFoSupplyReadiness` (coords,
 * schedule, capacity) which gates customer-path matching geometry.
 */

export type FoExecutionReadinessReason =
  | "FO_MISSING_PROVIDER_LINK"
  | "FO_INVALID_PROVIDER_LINK";

export type FoExecutionReadinessInput = {
  franchiseOwnerUserId: string;
  providerId: string | null;
  /** `ServiceProvider.userId` when provider row is joined; null if missing or not loaded. */
  providerUserId: string | null | undefined;
};

export function evaluateFoExecutionReadiness(
  input: FoExecutionReadinessInput,
): { ok: boolean; reasons: FoExecutionReadinessReason[] } {
  const reasons: FoExecutionReadinessReason[] = [];

  if (input.providerId == null || String(input.providerId).trim() === "") {
    reasons.push("FO_MISSING_PROVIDER_LINK");
    return { ok: false, reasons };
  }

  const pu = input.providerUserId;
  if (pu == null || pu === "") {
    reasons.push("FO_INVALID_PROVIDER_LINK");
    return { ok: false, reasons };
  }

  if (pu !== input.franchiseOwnerUserId) {
    reasons.push("FO_INVALID_PROVIDER_LINK");
    return { ok: false, reasons };
  }

  return { ok: true, reasons: [] };
}
