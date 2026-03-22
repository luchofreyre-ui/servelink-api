import { useNavigate } from "react-router-dom";
import { AdminTable } from "../../../app/components/tables/AdminTable";
import { ADMIN_ROUTES } from "../../../app/routes/adminRoutes";
import { formatDateTime, formatRelativeTime } from "../../../app/lib/format";
import { DispatchExceptionSeverityBadge } from "./DispatchExceptionSeverityBadge";
import type { DispatchExceptionItem } from "../api/types";

type Props = {
  items: DispatchExceptionItem[];
  onAcknowledge?: (bookingId: string) => void;
  onResolve?: (bookingId: string) => void;
};

export function DispatchExceptionsTable({
  items,
  onAcknowledge,
  onResolve,
}: Props) {
  const navigate = useNavigate();

  return (
    <AdminTable
      columns={
        <tr className="text-left text-sm text-gray-600">
          <th className="px-4 py-3">Severity</th>
          <th className="px-4 py-3">Booking</th>
          <th className="px-4 py-3">Type</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Scheduled Start</th>
          <th className="px-4 py-3">FO</th>
          <th className="px-4 py-3">Reason</th>
          <th className="px-4 py-3">Candidates</th>
          <th className="px-4 py-3">Age</th>
          <th className="px-4 py-3">Actions</th>
        </tr>
      }
    >
      {items.map((row) => (
        <tr
          key={row.bookingId}
          className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
          onClick={() => navigate(ADMIN_ROUTES.bookingDetail(row.bookingId))}
        >
          <td className="px-4 py-3">
            <DispatchExceptionSeverityBadge severity={row.severity} />
          </td>
          <td className="px-4 py-3 font-medium">{row.bookingId}</td>
          <td className="px-4 py-3 text-sm">
            {row.exceptionReasons?.[0] ?? row.latestDecisionStatus ?? "—"}
          </td>
          <td className="px-4 py-3 text-sm">{row.bookingStatus ?? "—"}</td>
          <td className="px-4 py-3 text-sm">{formatDateTime(row.scheduledStart)}</td>
          <td className="px-4 py-3 text-sm">
            {row.latestSelectedFranchiseOwnerId ?? "—"}
          </td>
          <td className="px-4 py-3 text-sm">
            {row.exceptionReasons?.join(", ") ?? "—"}
          </td>
          <td className="px-4 py-3 text-sm">{row.totalDispatchPasses}</td>
          <td className="px-4 py-3 text-sm">
            {formatRelativeTime(row.latestCreatedAt)}
          </td>
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => navigate(ADMIN_ROUTES.bookingDetail(row.bookingId))}
              >
                Open
              </button>
              {onAcknowledge && (
                <button
                  type="button"
                  className="text-xs text-gray-600 hover:underline"
                  onClick={() => onAcknowledge(row.bookingId)}
                >
                  Ack
                </button>
              )}
              {onResolve && (
                <button
                  type="button"
                  className="text-xs text-gray-600 hover:underline"
                  onClick={() => onResolve(row.bookingId)}
                >
                  Resolve
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
