import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../app/routes/adminRoutes";
import { SupplyRiskBadge } from "./SupplyRiskBadge";
import { TopNeededSkusList } from "./TopNeededSkusList";
import type { SupplyOverviewItem } from "../api/types";

type SupplyOverviewTableProps = {
  items: SupplyOverviewItem[];
};

export function SupplyOverviewTable({ items }: SupplyOverviewTableProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">No supply data.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="px-3 py-2">FO</th>
            <th className="px-3 py-2">Territory</th>
            <th className="px-3 py-2">Risk</th>
            <th className="px-3 py-2">Days to stockout</th>
            <th className="px-3 py-2">Open demand</th>
            <th className="px-3 py-2">Recommended shipment</th>
            <th className="px-3 py-2">Top SKUs</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.foId} className="border-b border-gray-100">
              <td className="px-3 py-2 font-medium">{row.foName}</td>
              <td className="px-3 py-2 text-gray-600">{row.territory ?? "—"}</td>
              <td className="px-3 py-2">
                <SupplyRiskBadge riskLevel={row.riskLevel} />
              </td>
              <td className="px-3 py-2">{row.daysUntilStockout ?? "—"}</td>
              <td className="px-3 py-2">{row.totalOpenDemand}</td>
              <td className="px-3 py-2">{row.recommendedShipmentValue}</td>
              <td className="px-3 py-2">
                <TopNeededSkusList skus={row.topNeededSkus} />
              </td>
              <td className="px-3 py-2">
                <Link
                  to={ADMIN_ROUTES.foSupplyDetail(row.foId)}
                  className="text-blue-600 hover:underline"
                >
                  Detail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
