import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../app/routes/adminRoutes";
import type { FoSupplyFleetOverviewItem } from "../api/types";
import { labelForFoSupplyReason } from "../lib/foSupplyReasonLabels";

function yesNo(v: boolean): string {
  return v ? "Yes" : "No";
}

function queueLabel(state: FoSupplyFleetOverviewItem["queueState"]): string {
  switch (state) {
    case "READY_TO_ACTIVATE":
      return "Ready to activate";
    case "BLOCKED_CONFIGURATION":
      return "Blocked (config)";
    case "ACTIVE_AND_READY":
      return "Active & ready";
    case "ACTIVE_BUT_BLOCKED":
      return "Active (blocked)";
    default:
      return state;
  }
}

export function FoSupplyFleetOverviewTable({
  items,
}: {
  items: FoSupplyFleetOverviewItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase text-gray-500">
            <th className="py-2 pr-3 font-medium">FO</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Queue</th>
            <th className="py-2 pr-3 font-medium">Supply</th>
            <th className="py-2 pr-3 font-medium">Exec</th>
            <th className="py-2 pr-3 font-medium">Eligible</th>
            <th className="py-2 pr-3 font-medium">Reasons</th>
            <th className="py-2 pr-3 font-medium">Sched</th>
            <th className="py-2 pr-3 font-medium">Travel</th>
            <th className="py-2 pr-3 font-medium">Svc types</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-100"
              data-testid="fo-supply-fleet-row"
              data-fo-id={row.id}
            >
              <td className="py-2 pr-3 align-top">
                <Link
                  className="font-medium text-blue-700 hover:underline"
                  to={ADMIN_ROUTES.foSupplyDetail(row.id)}
                  data-testid={`fo-supply-fleet-link-${row.id}`}
                >
                  {row.displayName}
                </Link>
                <div className="text-xs text-gray-500">{row.id}</div>
              </td>
              <td className="py-2 pr-3 align-top">{row.status}</td>
              <td className="py-2 pr-3 align-top text-xs">{queueLabel(row.queueState)}</td>
              <td className="py-2 pr-3 align-top">{yesNo(row.supplyOk)}</td>
              <td className="py-2 pr-3 align-top" data-testid="fo-supply-fleet-exec">
                {yesNo(row.executionOk)}
              </td>
              <td className="py-2 pr-3 align-top">{yesNo(row.bookingEligible)}</td>
              <td className="max-w-[220px] py-2 pr-3 align-top text-xs text-gray-700">
                {row.mergedReasonCodes.length === 0 ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  <ul className="list-inside list-disc space-y-0.5">
                    {row.mergedReasonCodes.slice(0, 4).map((code) => (
                      <li key={code} title={labelForFoSupplyReason(code)}>
                        {code}
                      </li>
                    ))}
                    {row.mergedReasonCodes.length > 4 ? (
                      <li className="list-none text-gray-500">
                        +{row.mergedReasonCodes.length - 4} more
                      </li>
                    ) : null}
                  </ul>
                )}
              </td>
              <td className="py-2 pr-3 align-top tabular-nums">
                {row.configSummary.scheduleRowCount}
              </td>
              <td className="py-2 pr-3 align-top tabular-nums">
                {row.configSummary.maxTravelMinutes ?? "—"}
              </td>
              <td className="py-2 pr-3 align-top text-xs">
                {row.configSummary.matchableServiceTypes.length === 0
                  ? "All"
                  : row.configSummary.matchableServiceTypes.join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
