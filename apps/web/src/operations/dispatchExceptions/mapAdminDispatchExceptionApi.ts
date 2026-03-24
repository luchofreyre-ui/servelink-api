import type { AdminDispatchExceptionApiItem } from "@/lib/api/adminDispatchExceptions";
import type { DispatchException, DispatchExceptionType } from "./dispatchExceptionTypes";

function inferUiType(item: AdminDispatchExceptionApiItem): DispatchExceptionType {
  const blob = [
    ...item.exceptionReasons,
    item.latestTrigger ?? "",
    item.latestTriggerDetail ?? "",
    item.recommendedAction ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (blob.includes("no candidate") || blob.includes("no_candidates")) {
    return "NO_ACCEPTANCE";
  }
  if (blob.includes("expir") || blob.includes("offer")) {
    return "EXPIRED_OFFER";
  }
  if (blob.includes("sla") || blob.includes("late") || blob.includes("miss")) {
    return "SLA_MISS";
  }
  if (
    blob.includes("reassign") ||
    blob.includes("multi") ||
    blob.includes("pass") ||
    item.totalDispatchPasses >= 3
  ) {
    return "REASSIGNMENT";
  }
  if (blob.includes("no-show") || blob.includes("noshow")) {
    return "NO_SHOW_RISK";
  }
  if (blob.includes("overload") || blob.includes("load")) {
    return "OVERLOAD_RISK";
  }
  return "REASSIGNMENT";
}

function summaryFromItem(item: AdminDispatchExceptionApiItem): string {
  if (item.exceptionReasons?.length) {
    return item.exceptionReasons.join(" · ");
  }
  const parts = [item.latestTrigger, item.latestTriggerDetail].filter(Boolean);
  return parts.length ? parts.join(" — ") : "Dispatch exception";
}

/**
 * Maps GET /api/v1/admin/dispatch/exceptions rows into the table/drawer model.
 */
export function mapAdminDispatchExceptionToUi(
  item: AdminDispatchExceptionApiItem,
): DispatchException {
  const type = inferUiType(item);
  const createdAt =
    item.latestCreatedAt?.trim() ||
    item.scheduledStart ||
    new Date().toISOString();

  return {
    id: `admin_dispatch_${item.bookingId}_${item.latestCreatedAt ?? "row"}`,
    bookingId: item.bookingId,
    foId: item.latestSelectedFranchiseOwnerId ?? undefined,
    type,
    createdAt,
    severity: item.severity,
    summary: summaryFromItem(item),
    source: "admin_dispatch_api",
    apiDetail: {
      recommendedAction: item.recommendedAction,
      exceptionReasons: item.exceptionReasons ?? [],
      bookingStatus: item.bookingStatus,
      latestTrigger: item.latestTrigger,
      totalDispatchPasses: item.totalDispatchPasses,
      priorityBucket: item.priorityBucket,
      requiresFollowUp: item.requiresFollowUp,
    },
  };
}
