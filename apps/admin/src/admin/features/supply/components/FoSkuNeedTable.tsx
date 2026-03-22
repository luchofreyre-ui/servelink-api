import type { FoSupplyDetail } from "../api/types";

type FoSkuNeedTableProps = {
  skuNeeds: FoSupplyDetail["skuNeeds"];
};

export function FoSkuNeedTable({ skuNeeds }: FoSkuNeedTableProps) {
  if (skuNeeds.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">No SKU needs.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Quantity needed</th>
            <th className="px-3 py-2">Priority</th>
          </tr>
        </thead>
        <tbody>
          {skuNeeds.map((row) => (
            <tr key={row.skuId} className="border-b border-gray-100">
              <td className="px-3 py-2 font-mono text-xs">{row.skuId}</td>
              <td className="px-3 py-2">{row.skuName}</td>
              <td className="px-3 py-2">{row.quantityNeeded}</td>
              <td className="px-3 py-2">{row.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
