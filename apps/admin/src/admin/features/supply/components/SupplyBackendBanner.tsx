/**
 * Shown on supply pages when backend supply endpoints are not live yet.
 */
export function SupplyBackendBanner() {
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Supply UI is ready. Backend supply endpoints are not live yet.
    </div>
  );
}
