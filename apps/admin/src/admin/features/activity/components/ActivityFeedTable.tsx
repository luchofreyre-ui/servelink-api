import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../app/routes/adminRoutes";
import { formatDateTime } from "../../../app/lib/format";
import type { AdminActivityItem } from "../api/types";

type ActivityFeedTableProps = {
  items: AdminActivityItem[];
};

function entityLink(item: AdminActivityItem) {
  if (item.bookingId) {
    return (
      <Link
        to={ADMIN_ROUTES.bookingDetail(item.bookingId)}
        className="text-blue-600 hover:underline"
      >
        Booking {item.bookingId.slice(0, 12)}…
      </Link>
    );
  }
  if (item.dispatchConfigId) {
    return (
      <Link
        to={ADMIN_ROUTES.dispatchConfig}
        className="text-blue-600 hover:underline"
      >
        Dispatch config
      </Link>
    );
  }
  return <span className="text-gray-500">—</span>;
}

export function ActivityFeedTable({ items }: ActivityFeedTableProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">No activity yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Entity</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Summary</th>
            <th className="px-3 py-2">Actor</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="px-3 py-2 text-gray-600">
                {formatDateTime(item.createdAt)}
              </td>
              <td className="px-3 py-2 font-medium">{item.type}</td>
              <td className="px-3 py-2">{entityLink(item)}</td>
              <td className="px-3 py-2">{item.title}</td>
              <td className="px-3 py-2 text-gray-600">{item.description}</td>
              <td className="px-3 py-2 text-gray-500">
                {item.actorAdminUserId ? `Admin ${item.actorAdminUserId.slice(0, 8)}…` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
