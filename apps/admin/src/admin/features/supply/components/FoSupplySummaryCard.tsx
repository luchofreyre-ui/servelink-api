import { SupplyRiskBadge } from "./SupplyRiskBadge";
import type { FoSupplyDetail } from "../api/types";

type FoSupplySummaryCardProps = {
  detail: FoSupplyDetail;
};

export function FoSupplySummaryCard({ detail }: FoSupplySummaryCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">FO Summary</h2>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-500">FO ID</dt>
          <dd className="font-medium">{detail.foId}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Name</dt>
          <dd>{detail.foName}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Territory</dt>
          <dd>{detail.territory ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Risk</dt>
          <dd>
            <SupplyRiskBadge riskLevel={detail.riskLevel} />
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Days to stockout</dt>
          <dd>{detail.daysUntilStockout ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Total open demand</dt>
          <dd>{detail.totalOpenDemand}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Last restock</dt>
          <dd>{detail.lastRestockAt ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
