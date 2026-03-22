"use client";

import Link from "next/link";
import { AdminActivityTypeChip } from "@/components/admin/operations/AdminActivityTypeChip";
import { AdminStatusChip } from "@/components/admin/operations/AdminStatusChip";
import { labelWorkflowState } from "@/components/admin/operations/adminOperationsLabels";
import type { AdminActivityRowModel } from "@/hooks/admin/useAdminActivityFeed";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

type AdminActivityRowProps = {
  row: AdminActivityRowModel;
};

export function AdminActivityRow({ row }: AdminActivityRowProps) {
  const workflowLabel = labelWorkflowState(row.workflowState);

  return (
    <li
      className="rounded-lg border border-white/10 bg-white/5 p-4"
      data-testid="admin-activity-row"
      data-activity-type={row.type}
      data-booking-id={row.bookingId ?? undefined}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{row.title}</p>
            <AdminActivityTypeChip type={row.type} />
            {workflowLabel ? (
              <AdminStatusChip label={workflowLabel} variant="info" />
            ) : null}
          </div>
          <p className="text-sm text-white/70">
            {row.summary?.trim() || "No additional detail for this event."}
          </p>
          <p className="text-xs text-white/45">{formatDateTime(row.createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {row.bookingId ? (
            <Link
              className="text-sm font-medium text-sky-300 underline-offset-2 hover:underline"
              href={`/admin/bookings/${row.bookingId}`}
            >
              Open booking
            </Link>
          ) : row.anomalyId ? (
            <span className="text-sm text-white/40">Open anomaly (coming soon)</span>
          ) : row.detailPath && row.detailPath.startsWith("/") ? (
            <Link
              className="text-sm font-medium text-sky-300 underline-offset-2 hover:underline"
              href={row.detailPath}
            >
              View detail
            </Link>
          ) : (
            <span className="text-sm text-white/35">No navigation target</span>
          )}
        </div>
      </div>
    </li>
  );
}
