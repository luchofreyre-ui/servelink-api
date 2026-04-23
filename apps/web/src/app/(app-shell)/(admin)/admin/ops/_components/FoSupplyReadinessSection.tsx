import type { FoSupplyReadinessItem } from "@/lib/api/adminOps";

function formatReasons(reasons: string[]): string {
  if (!reasons.length) return "—";
  return reasons.join(", ");
}

function formatServiceTypes(types: string[]): string {
  if (!types.length) return "(all)";
  return types.join(", ");
}

function formatCapacity(s: FoSupplyReadinessItem["configSummary"]): string {
  const d =
    s.maxDailyLaborMinutes == null ? "daily:∞" : `daily:${s.maxDailyLaborMinutes}`;
  const j =
    s.maxLaborMinutes == null ? "job:∞" : `job:${s.maxLaborMinutes}`;
  const q =
    s.maxSquareFootage == null ? "sqft:∞" : `sqft:${s.maxSquareFootage}`;
  return `${d} ${j} ${q}`;
}

function categoryLabel(c: FoSupplyReadinessItem["opsCategory"]): string {
  switch (c) {
    case "ready":
      return "Ready";
    case "blocked_configuration":
      return "Blocked (config)";
    case "inactive_or_restricted":
      return "Inactive / restricted";
    default:
      return c;
  }
}

export function FoSupplyReadinessSection({
  items,
}: {
  items: FoSupplyReadinessItem[];
}) {
  if (!items.length) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No franchise owners in database.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left">
            <th className="p-2">FO</th>
            <th className="p-2">Status</th>
            <th className="p-2">Category</th>
            <th className="p-2">Supply OK</th>
            <th className="p-2">Booking eligible</th>
            <th className="p-2">Reason codes</th>
            <th className="p-2">Travel (min)</th>
            <th className="p-2">Sched rows</th>
            <th className="p-2">Service types</th>
            <th className="p-2">Capacity</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const eligReasons = [
              ...row.eligibility.reasons,
            ];
            const supplyReasons = row.supply.reasons;
            const allCodes = Array.from(
              new Set([...supplyReasons, ...eligReasons]),
            );
            return (
              <tr
                key={row.franchiseOwnerId}
                className="border-b align-top"
                data-testid={`fo-supply-row-${row.franchiseOwnerId}`}
              >
                <td className="p-2">
                  <div className="font-medium">{row.displayName}</div>
                  <div className="text-xs text-gray-500">{row.email}</div>
                  <div className="font-mono text-xs text-gray-400">
                    {row.franchiseOwnerId}
                  </div>
                </td>
                <td className="p-2 whitespace-nowrap">
                  {row.status}
                  {row.safetyHold ? " · hold" : ""}
                </td>
                <td className="p-2 whitespace-nowrap">
                  {categoryLabel(row.opsCategory)}
                </td>
                <td className="p-2">{row.supply.ok ? "yes" : "no"}</td>
                <td className="p-2">
                  {row.eligibility.canAcceptBooking ? "yes" : "no"}
                </td>
                <td
                  className="p-2 font-mono text-xs max-w-[280px] break-words"
                  title={allCodes.join(", ")}
                >
                  {formatReasons(allCodes)}
                </td>
                <td className="p-2 whitespace-nowrap">
                  {row.configSummary.maxTravelMinutes ?? "—"}
                </td>
                <td className="p-2">{row.configSummary.scheduleRowCount}</td>
                <td className="p-2 text-xs max-w-[200px] break-words">
                  {formatServiceTypes(row.configSummary.matchableServiceTypes)}
                </td>
                <td className="p-2 text-xs whitespace-nowrap">
                  {formatCapacity(row.configSummary)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
