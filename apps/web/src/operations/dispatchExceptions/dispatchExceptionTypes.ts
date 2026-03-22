export type DispatchExceptionType =
  | "NO_ACCEPTANCE"
  | "EXPIRED_OFFER"
  | "SLA_MISS"
  | "REASSIGNMENT"
  | "NO_SHOW_RISK"
  | "OVERLOAD_RISK";

export interface DispatchException {
  id: string;
  bookingId: string;
  foId?: string;
  type: DispatchExceptionType;
  createdAt: string;
  severity: "low" | "medium" | "high";
  summary: string;
}
