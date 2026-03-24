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
  /** `admin_dispatch_api` when loaded from GET /api/v1/admin/dispatch/exceptions */
  source?: "portfolio_snapshot" | "admin_dispatch_api";
  apiDetail?: {
    recommendedAction: string;
    exceptionReasons: string[];
    bookingStatus: string | null;
    latestTrigger: string | null;
    totalDispatchPasses: number;
    priorityBucket: string;
    requiresFollowUp: boolean;
  };
}
