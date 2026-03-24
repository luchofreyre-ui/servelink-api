/** Aligns with intake-to-estimate.mapper mapServiceIdToServiceType deep_clean branch. */
export function intakeServiceIdImpliesDeepClean(serviceId: string): boolean {
  return String(serviceId ?? "").toLowerCase().includes("deep");
}
