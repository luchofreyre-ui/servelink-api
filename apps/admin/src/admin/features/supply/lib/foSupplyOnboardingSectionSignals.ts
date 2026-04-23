import type { FoSupplyQueueState, FoSupplyReadinessSnapshot } from "../api/types";

export type FoOnboardSectionId =
  | "profile"
  | "serviceArea"
  | "serviceTypes"
  | "capacity"
  | "schedule"
  | "activation";

/** Narrow UI hints only — derived from server fields already on the detail payload. */
export type FoOnboardSectionSignal = "complete" | "incomplete" | "invalid";

export type FoOnboardSectionRow = {
  id: FoOnboardSectionId;
  label: string;
  signal: FoOnboardSectionSignal;
};

function hasReason(r: FoSupplyReadinessSnapshot, code: string): boolean {
  return r.supply.reasons.includes(code) || r.eligibility.reasons.includes(code);
}

export function deriveFoOnboardingSectionRows(
  readiness: FoSupplyReadinessSnapshot,
  queueState: FoSupplyQueueState | undefined,
): FoOnboardSectionRow[] {
  const c = readiness.configSummary;

  const profileSignal: FoOnboardSectionSignal = readiness.displayName?.trim()
    ? "complete"
    : "incomplete";

  const coordsInvalid = hasReason(readiness, "FO_INVALID_COORDINATES");
  const coordsMissing =
    hasReason(readiness, "FO_MISSING_COORDINATES") || !c.hasCoordinates;
  const coordsSignal: FoOnboardSectionSignal = coordsInvalid
    ? "invalid"
    : coordsMissing
      ? "incomplete"
      : "complete";

  const travelInvalid = hasReason(readiness, "FO_INVALID_TRAVEL_CONSTRAINT");
  const travelMissing = c.maxTravelMinutes == null || c.maxTravelMinutes < 1;
  const travelSignal: FoOnboardSectionSignal = travelInvalid
    ? "invalid"
    : travelMissing
      ? "incomplete"
      : "complete";

  const serviceAreaTravelSignal = worstSignal(coordsSignal, travelSignal);

  const serviceTypesSignal: FoOnboardSectionSignal = "complete";

  const capacityInvalid = hasReason(readiness, "FO_INVALID_CAPACITY_CONFIG");
  const capacitySignal: FoOnboardSectionSignal = capacityInvalid ? "invalid" : "complete";

  const scheduleIncomplete = c.scheduleRowCount < 1;
  const scheduleSignal: FoOnboardSectionSignal = scheduleIncomplete ? "incomplete" : "complete";

  let activationSignal: FoOnboardSectionSignal = "incomplete";
  if (queueState === "ACTIVE_AND_READY" || queueState === "READY_TO_ACTIVATE") {
    activationSignal = "complete";
  } else if (queueState === "ACTIVE_BUT_BLOCKED") {
    activationSignal = "invalid";
  } else if (queueState === "BLOCKED_CONFIGURATION") {
    activationSignal = "incomplete";
  }

  return [
    { id: "profile", label: "Basic profile", signal: profileSignal },
    { id: "serviceArea", label: "Service area & travel", signal: serviceAreaTravelSignal },
    { id: "serviceTypes", label: "Service types", signal: serviceTypesSignal },
    { id: "capacity", label: "Capacity", signal: capacitySignal },
    { id: "schedule", label: "Weekly schedule", signal: scheduleSignal },
    { id: "activation", label: "Activation", signal: activationSignal },
  ];
}

function worstSignal(
  a: FoOnboardSectionSignal,
  b: FoOnboardSectionSignal,
): FoOnboardSectionSignal {
  if (a === "invalid" || b === "invalid") return "invalid";
  if (a === "incomplete" || b === "incomplete") return "incomplete";
  return "complete";
}

const REASON_SECTION: Record<string, string> = {
  FO_MISSING_PROVIDER_LINK: "Provider link",
  FO_INVALID_PROVIDER_LINK: "Provider link",
  FO_MISSING_COORDINATES: "Service area & travel",
  FO_INVALID_COORDINATES: "Service area & travel",
  FO_INVALID_TRAVEL_CONSTRAINT: "Service area & travel",
  FO_NO_SCHEDULING_SOURCE: "Weekly schedule",
  FO_INVALID_CAPACITY_CONFIG: "Capacity",
  FO_NOT_ACTIVE: "Activation",
  FO_SAFETY_HOLD: "Basic profile",
  FO_DELETED: "Basic profile",
  FO_BANNED: "Basic profile",
};

export function reasonCodesToSectionHintLine(codes: string[]): string | null {
  const labels = new Set<string>();
  for (const code of codes) {
    const label = REASON_SECTION[code];
    if (label) labels.add(label);
  }
  if (labels.size === 0) return null;
  return `Related setup areas: ${[...labels].join(" · ")}`;
}
