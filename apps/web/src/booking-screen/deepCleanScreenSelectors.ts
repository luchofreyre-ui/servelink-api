import type {
  BookingScreenDeepCleanCalibrationApi,
  BookingScreenDeepCleanExecutionApi,
  BookingScreenDeepCleanProgramApi,
} from "@/types/deepCleanProgram";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/**
 * Canonical fields from `GET .../screen` for deep clean UI (all roles).
 */
export function selectDeepCleanFieldsFromScreen(screen: unknown): {
  serviceType: string | null;
  rawProgram: BookingScreenDeepCleanProgramApi | null | undefined;
  rawExecution: BookingScreenDeepCleanExecutionApi | null | undefined;
  rawCalibration: BookingScreenDeepCleanCalibrationApi | null | undefined;
  bookingId: string;
} {
  const s = asRecord(screen);
  const estimateSnap = s ? asRecord(s.estimateSnapshot) : null;
  const serviceType =
    estimateSnap && typeof estimateSnap.serviceType === "string"
      ? estimateSnap.serviceType
      : null;
  const booking = s ? asRecord(s.booking) : null;
  const bookingId =
    booking && typeof booking.id === "string" ? booking.id : "";

  return {
    serviceType,
    rawProgram: s?.deepCleanProgram as
      | BookingScreenDeepCleanProgramApi
      | null
      | undefined,
    rawExecution: s?.deepCleanExecution as
      | BookingScreenDeepCleanExecutionApi
      | null
      | undefined,
    rawCalibration: s?.deepCleanCalibration as
      | BookingScreenDeepCleanCalibrationApi
      | null
      | undefined,
    bookingId,
  };
}

export function isDeepCleanServiceType(serviceType: string | null): boolean {
  return serviceType === "deep_clean";
}

export function deepCleanExecutionPayloadLooksPresent(
  raw: BookingScreenDeepCleanExecutionApi | null | undefined,
): boolean {
  if (!raw || typeof raw !== "object") return false;
  const visits = (raw as BookingScreenDeepCleanExecutionApi).visits;
  return Array.isArray(visits) && visits.length > 0;
}
