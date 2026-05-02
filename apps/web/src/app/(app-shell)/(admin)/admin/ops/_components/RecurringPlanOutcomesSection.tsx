"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchRecurringPlanOutcomes,
  type AdminRecurringPlanOutcome,
} from "@/lib/api/adminOps";

type ConvertedFilter = "all" | "converted" | "not_converted";

const cadenceLabels: Record<"weekly" | "biweekly" | "monthly", string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function customerLabel(outcome: AdminRecurringPlanOutcome): string {
  const customer = outcome.booking?.customer;
  return customer?.name || customer?.email || customer?.id || "Unknown";
}

function filterToParam(filter: ConvertedFilter): boolean | undefined {
  if (filter === "converted") return true;
  if (filter === "not_converted") return false;
  return undefined;
}

export function RecurringPlanOutcomesSection() {
  const [filter, setFilter] = useState<ConvertedFilter>("all");
  const [outcomes, setOutcomes] = useState<AdminRecurringPlanOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchRecurringPlanOutcomes({ converted: filterToParam(filter) })
      .then((items) => {
        if (cancelled) return;
        setOutcomes(items);
      })
      .catch(() => {
        if (cancelled) return;
        setOutcomes([]);
        setError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div className="space-y-4 bg-white p-4">
      <label className="text-sm font-medium text-gray-700">
        Outcome
        <select
          className="ml-2 rounded border px-2 py-1 text-sm font-normal"
          value={filter}
          onChange={(event) => setFilter(event.target.value as ConvertedFilter)}
        >
          <option value="all">All</option>
          <option value="converted">Converted</option>
          <option value="not_converted">Not Converted</option>
        </select>
      </label>

      {loading ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-500">
          Loading recurring plan outcomes...
        </div>
      ) : error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load recurring plan outcomes.
        </div>
      ) : outcomes.length === 0 ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-500">
          No recurring plan outcomes found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Booking</th>
                <th className="px-3 py-2">Converted</th>
                <th className="px-3 py-2">Cadence</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {outcomes.map((outcome) => (
                <tr
                  key={outcome.id}
                  data-testid={`recurring-plan-outcome-row-${outcome.id}`}
                >
                  <td className="px-3 py-2">
                    {formatDateTime(outcome.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">
                      {customerLabel(outcome)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {outcome.booking?.customer?.email ?? "-"}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {outcome.booking?.id ? (
                      <Link
                        href={`/admin/bookings/${encodeURIComponent(outcome.booking.id)}`}
                        className="text-blue-600 underline"
                      >
                        {outcome.booking.id}
                      </Link>
                    ) : (
                      outcome.bookingId
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {outcome.converted ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-2">
                    {outcome.cadence ? cadenceLabels[outcome.cadence] : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
