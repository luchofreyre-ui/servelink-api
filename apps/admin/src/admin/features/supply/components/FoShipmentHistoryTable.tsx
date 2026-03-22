import { formatDateTime } from "../../../app/lib/format";
import type { FoSupplyDetail } from "../api/types";

type FoShipmentHistoryTableProps = {
  shipmentHistory: FoSupplyDetail["shipmentHistory"];
};

export function FoShipmentHistoryTable({
  shipmentHistory,
}: FoShipmentHistoryTableProps) {
  if (shipmentHistory.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">No shipment history.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="px-3 py-2">Shipped at</th>
            <th className="px-3 py-2">Value</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {shipmentHistory.map((row) => (
            <tr key={row.id} className="border-b border-gray-100">
              <td className="px-3 py-2">{formatDateTime(row.shippedAt)}</td>
              <td className="px-3 py-2">{row.value}</td>
              <td className="px-3 py-2">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
