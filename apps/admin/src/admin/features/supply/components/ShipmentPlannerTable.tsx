import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../app/routes/adminRoutes";
import { formatDateTime } from "../../../app/lib/format";
import { SupplyRiskBadge } from "./SupplyRiskBadge";
import type { ShipmentPlannerItem } from "../api/types";

type ShipmentPlannerTableProps = {
  items: ShipmentPlannerItem[];
  onRowClick?: (item: ShipmentPlannerItem) => void;
};

export function ShipmentPlannerTable({ items, onRowClick }: ShipmentPlannerTableProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">No shipment suggestions.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="px-3 py-2">FO</th>
            <th className="px-3 py-2">Risk</th>
            <th className="px-3 py-2">Suggested ship date</th>
            <th className="px-3 py-2">Shipment value</th>
            <th className="px-3 py-2">Priority SKUs</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr
              key={row.foId}
              className="border-b border-gray-100 cursor-pointer hover:bg-gray-50"
              onClick={() => onRowClick?.(row)}
              role={onRowClick ? "button" : undefined}
            >
              <td className="px-3 py-2">
                <Link
                  to={ADMIN_ROUTES.foSupplyDetail(row.foId)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {row.foName}
                </Link>
              </td>
              <td className="px-3 py-2">
                <SupplyRiskBadge riskLevel={row.riskLevel} />
              </td>
              <td className="px-3 py-2">
                {row.suggestedShipDate
                  ? formatDateTime(row.suggestedShipDate)
                  : "—"}
              </td>
              <td className="px-3 py-2">{row.shipmentValue}</td>
              <td className="px-3 py-2">
                {row.prioritySkus.length > 0
                  ? row.prioritySkus.slice(0, 3).join(", ")
                  : "—"}
              </td>
              <td className="px-3 py-2 text-gray-600">{row.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
