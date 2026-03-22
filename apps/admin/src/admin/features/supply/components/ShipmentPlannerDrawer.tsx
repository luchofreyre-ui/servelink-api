import type { ShipmentPlannerItem } from "../api/types";

type ShipmentPlannerDrawerProps = {
  open: boolean;
  onClose: () => void;
  item: ShipmentPlannerItem | null;
};

export function ShipmentPlannerDrawer({
  open,
  onClose,
  item,
}: ShipmentPlannerDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l bg-white shadow-xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Shipment detail</h2>
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
                <dt className="text-gray-500">FO</dt>
                <dd className="font-medium">{item.foName} ({item.foId})</dd>
              </div>
              <div>
                <dt className="text-gray-500">Risk</dt>
                <dd>{item.riskLevel}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Suggested ship date</dt>
                <dd>{item.suggestedShipDate ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Shipment value</dt>
                <dd>{item.shipmentValue}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Priority SKUs</dt>
                <dd>{item.prioritySkus.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Notes</dt>
                <dd>{item.notes ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No item selected.</p>
          )}
        </div>
      </div>
    </div>
  );
}
