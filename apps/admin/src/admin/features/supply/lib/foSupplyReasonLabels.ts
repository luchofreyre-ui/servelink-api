/** Human labels for server reason codes (codes stay visible for ops). */
export const FO_SUPPLY_REASON_LABELS: Record<string, string> = {
  FO_ACTIVATION_BLOCKED: "Activation blocked (see reasons below)",
  FO_MISSING_COORDINATES: "Missing home coordinates",
  FO_INVALID_COORDINATES: "Invalid home coordinates",
  FO_INVALID_TRAVEL_CONSTRAINT: "Invalid travel limit (max travel minutes)",
  FO_NO_SCHEDULING_SOURCE: "No weekly schedule rows",
  FO_INVALID_CAPACITY_CONFIG: "Invalid capacity limits",
  FO_NOT_ACTIVE: "FO status is not active",
  FO_SAFETY_HOLD: "Safety hold is on",
  FO_DELETED: "FO marked deleted",
  FO_BANNED: "FO banned",
  FO_MISSING_PROVIDER_LINK: "ServiceProvider not linked to this franchise owner",
  FO_INVALID_PROVIDER_LINK: "Provider link is missing or does not match FO user",
};

export function labelForFoSupplyReason(code: string): string {
  return FO_SUPPLY_REASON_LABELS[code] ?? code;
}
