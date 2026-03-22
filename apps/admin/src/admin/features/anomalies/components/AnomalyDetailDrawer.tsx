import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../app/routes/adminRoutes";
import { formatDateTime } from "../../../app/lib/format";
import type { OpsAnomalyItem } from "../api/types";

type AnomalyDetailDrawerProps = {
  open: boolean;
  onClose: () => void;
  item: OpsAnomalyItem | null;
};

export function AnomalyDetailDrawer({
  open,
  onClose,
  item,
}: AnomalyDetailDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l bg-white shadow-xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Anomaly detail</h2>
          <button
            type="button"
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {item ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">ID</dt>
                <dd className="font-mono">{item.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Fingerprint</dt>
                <dd className="font-mono break-all">{item.fingerprint ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd>{item.anomalyType}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Severity</dt>
                <dd>{item.severity ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>{item.opsStatus}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last seen</dt>
                <dd>{formatDateTime(item.lastSeenAt ?? item.createdAt)}</dd>
              </div>
              {item.bookingId && (
                <div>
                  <dt className="text-gray-500">Booking</dt>
                  <dd>
                    <Link
                      to={ADMIN_ROUTES.bookingDetail(item.bookingId)}
                      className="text-blue-600 hover:underline"
                    >
                      {item.bookingId}
                    </Link>
                  </dd>
                </div>
              )}
              {item.foId && (
                <div>
                  <dt className="text-gray-500">Franchise owner</dt>
                  <dd>
                    <Link
                      to={ADMIN_ROUTES.foSupplyDetail(item.foId)}
                      className="text-blue-600 hover:underline"
                    >
                      {item.foId}
                    </Link>
                  </dd>
                </div>
              )}
              {item.payload != null && (
                <div>
                  <dt className="text-gray-500">Payload</dt>
                  <dd>
                    <pre className="max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs">
                      {JSON.stringify(item.payload, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No item selected.</p>
          )}
        </div>
      </div>
    </div>
  );
}
