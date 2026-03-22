import type { BookingBillingModel } from "./bookingBillingModel";
import type { DispatchCandidate } from "./dispatchCandidate";
import type { OperationalSignalContract } from "./operationalSignal";

export interface BookingCore {
  id: string;
  status?: string;
  serviceLabel?: string;
  customerName?: string;
  locationLabel?: string;
  scheduledStart?: string;
}

export interface DispatchHistoryEvent {
  id?: string;
  timestamp: string;
  title: string;
  detail: string;
  tone?: "neutral" | "positive" | "warning" | "critical";
}

export interface BookingScreen {
  booking: BookingCore;
  assignedFoId?: string;
  assignedFoLabel?: string;

  dispatchCandidates: DispatchCandidate[];
  billing?: BookingBillingModel;
  dispatchHistory: DispatchHistoryEvent[];

  signals?: OperationalSignalContract;
}
