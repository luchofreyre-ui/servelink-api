import type { BookingDirectionEstimatePreviewResponse } from "./bookingDirectionIntakeApi";

export type EstimateStatus =
  | "idle"
  | "loading"
  | "success"
  | "error";

export type EstimateFailureType =
  | "ESTIMATE_EXECUTION_FAILED"
  | "ESTIMATE_INPUT_INVALID"
  | "UNKNOWN";

export interface EstimateState {
  status: EstimateStatus;
  requestKey: string | null;
  data: BookingDirectionEstimatePreviewResponse | null;
  failureType?: EstimateFailureType;
  errorMessage?: string;
}

export const createInitialEstimateState = (): EstimateState => ({
  status: "idle",
  requestKey: null,
  data: null,
});
