/** Matches API intake `intakeServiceIdImpliesDeepClean` / estimator deep_clean routing. */
export function isDeepCleaningBookingServiceId(serviceId: string): boolean {
  return String(serviceId ?? "").toLowerCase().includes("deep");
}
