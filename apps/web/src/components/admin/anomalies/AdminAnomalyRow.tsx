"use client";

import Link from "next/link";
import { AdminSlaChip } from "@/components/admin/operations/AdminSlaChip";
import { AdminStatusChip } from "@/components/admin/operations/AdminStatusChip";
import {
  labelOpsAnomalyStatus,
  labelReviewState,
  labelWorkflowState,
} from "@/components/admin/operations/adminOperationsLabels";
import type { AdminAnomalyRowModel } from "@/hooks/admin/useAdminAnomalies";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

type AdminAnomalyRowProps = {
  row: AdminAnomalyRowModel;
};

export function AdminAnomalyRow({ row }: AdminAnomalyRowProps) {
  const statusLabel = labelOpsAnomalyStatus(row.status);
  const reviewLabel = labelReviewState(row.reviewState);
  const workflowLabel = labelWorkflowState(row.bookingWorkflowState);

  return (
    <li
      className="rounded-lg border border-white/10 bg-white/5 p-4"
      data-testid="admin-anomaly-row"
      data-booking-id={row.bookingId ?? undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-white">{row.title}</p>
          <div className="flex flex-wrap gap-2">
            <AdminStatusChip label={statusLabel} variant="warning" />
            {row.assigneeLabel ? (
              <AdminStatusChip label={row.assigneeLabel} variant="neutral" />
            ) : null}
            <AdminSlaChip slaState={row.slaState} />
            {workflowLabel ? (
              <AdminStatusChip label={workflowLabel} variant="info" />
            ) : null}
            {reviewLabel ? (
              <AdminStatusChip label={reviewLabel} variant="success" />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-4 text-xs text-white/50">
            {row.bookingStatus ? <span>Booking: {row.bookingStatus}</span> : null}
            <span>Last seen: {formatDateTime(row.lastSeenAt)}</span>
          </div>
        </div>
        <div className="shrink-0">
          {row.bookingId ? (
            <Link
              className="text-sm font-medium text-sky-300 underline-offset-2 hover:underline"
              href={`/admin/bookings/${row.bookingId}`}
            >
              Open booking
            </Link>
          ) : (
            <span className="text-sm text-white/35">No booking link</span>
          )}
        </div>
      </div>
    </li>
  );
}
