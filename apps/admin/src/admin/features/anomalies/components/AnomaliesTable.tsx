import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../app/routes/adminRoutes";
import { formatDateTime } from "../../../app/lib/format";
import { AdminStatusBadge } from "../../../app/components/badges/AdminStatusBadge";
import type { OpsAnomalyItem } from "../api/types";

type AnomaliesTableProps = {
  items: OpsAnomalyItem[];
  onAck: (item: OpsAnomalyItem) => void;
  onResolve: (item: OpsAnomalyItem) => void;
  onOpenDrawer: (item: OpsAnomalyItem) => void;
  isAcking?: string;
  isResolving?: string;
};

export function AnomaliesTable({
  items,
  onAck,
  onResolve,
  onOpenDrawer,
  isAcking,
  isResolving,
}: AnomaliesTableProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">No anomalies match filters.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="px-3 py-2">Severity</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Fingerprint</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Last seen</th>
            <th className="px-3 py-2">Entity</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="px-3 py-2">
                <AdminStatusBadge
                  label={item.severity ?? "info"}
                  variant={
                    item.severity === "critical"
                      ? "error"
                      : item.severity === "warning"
                        ? "warning"
                        : "info"
                  }
                />
              </td>
              <td className="px-3 py-2 font-medium">{item.anomalyType}</td>
              <td className="px-3 py-2 font-mono text-xs">
                {item.fingerprint ? item.fingerprint.slice(0, 12) + "…" : "—"}
              </td>
              <td className="px-3 py-2">{item.opsStatus}</td>
              <td className="px-3 py-2 text-gray-600">
                {formatDateTime(item.lastSeenAt ?? item.createdAt)}
              </td>
              <td className="px-3 py-2">
                {item.bookingId ? (
                  <Link
                    to={ADMIN_ROUTES.bookingDetail(item.bookingId)}
                    className="text-blue-600 hover:underline"
                  >
                    Booking
                  </Link>
                ) : item.foId ? (
                  <Link
                    to={ADMIN_ROUTES.foSupplyDetail(item.foId)}
                    className="text-blue-600 hover:underline"
                  >
                    FO
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => onOpenDrawer(item)}
                  >
                    Detail
                  </button>
                  {item.opsStatus === "open" && (
                    <>
                      <button
                        type="button"
                        className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                        onClick={() => onAck(item)}
                        disabled={isAcking === item.id || (item.fingerprint != null && isAcking === item.fingerprint)}
                      >
                        Ack
                      </button>
                      <button
                        type="button"
                        className="text-xs text-green-600 hover:underline disabled:opacity-50"
                        onClick={() => onResolve(item)}
                        disabled={isResolving === item.id || (item.fingerprint != null && isResolving === item.fingerprint)}
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
