"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchAdminRecurringPlans,
  type AdminRecurringPlan,
} from "@/lib/api/adminOps";

type PlanStatusFilter = "all" | "active" | "paused" | "cancelled";
type PlanCadenceFilter = "all" | "weekly" | "biweekly" | "monthly";

const cadenceLabels: Record<Exclude<PlanCadenceFilter, "all">, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

const statusLabels: Record<Exclude<PlanStatusFilter, "all">, string> = {
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function customerLabel(plan: AdminRecurringPlan): string {
  const customer = plan.booking?.customer;
  return customer?.name || customer?.email || customer?.phone || customer?.id || "Unknown";
}

export function RecurringPlansSection() {
  const [status, setStatus] = useState<PlanStatusFilter>("all");
  const [cadence, setCadence] = useState<PlanCadenceFilter>("all");
  const [plans, setPlans] = useState<AdminRecurringPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchAdminRecurringPlans({
      ...(status !== "all" ? { status } : {}),
      ...(cadence !== "all" ? { cadence } : {}),
    })
      .then((items) => {
        if (cancelled) return;
        setPlans(items);
      })
      .catch(() => {
        if (cancelled) return;
        setPlans([]);
        setError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, cadence]);

  return (
    <div className="space-y-4 bg-white p-4">
      <div className="flex flex-wrap gap-3">
        <label className="text-sm font-medium text-gray-700">
          Status
          <select
            className="ml-2 rounded border px-2 py-1 text-sm font-normal"
            value={status}
            onChange={(event) => setStatus(event.target.value as PlanStatusFilter)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <label className="text-sm font-medium text-gray-700">
          Cadence
          <select
            className="ml-2 rounded border px-2 py-1 text-sm font-normal"
            value={cadence}
            onChange={(event) => setCadence(event.target.value as PlanCadenceFilter)}
          >
            <option value="all">All</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-500">
          Loading recurring plans…
        </div>
      ) : error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load recurring plans.
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-500">
          No recurring plans found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Cadence</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Price/visit</th>
                <th className="px-3 py-2">Discount</th>
                <th className="px-3 py-2">Estimated minutes</th>
                <th className="px-3 py-2">Next run</th>
                <th className="px-3 py-2">Booking</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {plans.map((plan) => (
                <tr key={plan.id} data-testid={`recurring-plan-row-${plan.id}`}>
                  <td className="px-3 py-2">{formatDateTime(plan.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">
                      {customerLabel(plan)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {plan.booking?.customer?.email ?? "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">{cadenceLabels[plan.cadence]}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {statusLabels[plan.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {formatCurrency(plan.pricePerVisitCents)}
                  </td>
                  <td className="px-3 py-2">{plan.discountPercent}%</td>
                  <td className="px-3 py-2">{plan.estimatedMinutes}</td>
                  <td className="px-3 py-2">{formatDateTime(plan.nextRunAt)}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {plan.booking?.id ? (
                      <Link
                        href={`/admin/bookings/${encodeURIComponent(plan.booking.id)}`}
                        className="text-blue-600 underline"
                      >
                        {plan.booking.id}
                      </Link>
                    ) : (
                      plan.bookingId
                    )}
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
