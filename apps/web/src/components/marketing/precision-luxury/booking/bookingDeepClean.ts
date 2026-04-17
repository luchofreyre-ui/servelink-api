/** Matches API intake `intakeServiceIdImpliesDeepClean` / estimator deep_clean routing. */
export function isDeepCleaningBookingServiceId(serviceId: string): boolean {
  return String(serviceId ?? "").toLowerCase().includes("deep");
}

/** Move-in / move-out transition service (canonical public slug). */
export function isBookingMoveTransitionServiceId(serviceId: string): boolean {
  return String(serviceId ?? "").toLowerCase() === "move-in-move-out";
}
