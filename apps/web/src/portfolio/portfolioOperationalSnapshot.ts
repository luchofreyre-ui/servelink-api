import { normalizeBookingScreen, normalizeOperationalSignalContract } from "@/contracts/contractNormalization";
import type { BookingScreen } from "@/contracts/bookingScreen";
import type { OperationalSignalContract } from "@/contracts/operationalSignal";

export type BuildSnapshotSource =
  | "admin_console"
  | "admin_booking_detail"
  | "fo_console"
  | "customer_console"
  | "unknown";

export interface BuildSnapshotInput {
  bookingScreens: unknown[];
  source?: BuildSnapshotSource;
}

/** Portfolio-facing alias — same canonical shape as `OperationalSignalContract`. */
export type OperationalBookingSignal = OperationalSignalContract;

export interface FleetRollup {
  totalBookings: number;
  flaggedBookings: number;
  noAcceptanceCount: number;
  offerExpiredCount: number;
  slaMissCount: number;
  reassignmentCount: number;
  noShowRiskCount: number;
  overloadRiskCount: number;
}

export function extractOperationalSignalsFromScreen(input: unknown): OperationalBookingSignal | undefined {
  const signal = normalizeOperationalSignalContract(input);
  if (!signal) return undefined;

  return {
    bookingId: signal.bookingId,
    foId: signal.foId,
    signalTimestamp: signal.signalTimestamp,
    noAcceptance: signal.noAcceptance,
    offerExpired: signal.offerExpired,
    slaMiss: signal.slaMiss,
    reassignment: signal.reassignment,
    noShowRisk: signal.noShowRisk,
    overloadRisk: signal.overloadRisk,
  };
}

export function normalizeBookingScreens(input: unknown[]): BookingScreen[] {
  return input.map(normalizeBookingScreen).filter((value): value is BookingScreen => Boolean(value));
}

export function normalizeOperationalSignals(input: unknown[]): OperationalSignalContract[] {
  return input
    .map(normalizeOperationalSignalContract)
    .filter((value): value is OperationalSignalContract => Boolean(value));
}

export function buildFleetRollup(signals: OperationalBookingSignal[]): FleetRollup {
  return {
    totalBookings: signals.length,
    flaggedBookings: signals.filter(
      (signal) =>
        signal.noAcceptance ||
        signal.offerExpired ||
        signal.slaMiss ||
        signal.reassignment ||
        signal.noShowRisk ||
        signal.overloadRisk,
    ).length,
    noAcceptanceCount: signals.filter((signal) => signal.noAcceptance).length,
    offerExpiredCount: signals.filter((signal) => signal.offerExpired).length,
    slaMissCount: signals.filter((signal) => signal.slaMiss).length,
    reassignmentCount: signals.filter((signal) => signal.reassignment).length,
    noShowRiskCount: signals.filter((signal) => signal.noShowRisk).length,
    overloadRiskCount: signals.filter((signal) => signal.overloadRisk).length,
  };
}
