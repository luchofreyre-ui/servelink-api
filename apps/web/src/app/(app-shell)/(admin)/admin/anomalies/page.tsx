"use client";

import { AdminLaunchReadinessCard } from "@/components/admin/AdminLaunchReadinessCard";
import { AdminBookingRevenueReadinessCard } from "@/components/admin/AdminBookingRevenueReadinessCard";
import { AdminAnomaliesQueue } from "@/components/admin/anomalies/AdminAnomaliesQueue";
import { AdminOpsAnomaliesPanel } from "@/components/admin/AdminOpsAnomaliesPanel";

export default function AdminAnomaliesPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin anomalies</h1>
          <p className="max-w-3xl text-sm text-white/70">
            What needs attention right now? Ops alerts with SLA and ownership context—filters are
            shareable via the URL.
          </p>
        </div>
        <AdminLaunchReadinessCard />
        <AdminBookingRevenueReadinessCard />
        <AdminOpsAnomaliesPanel />
        <AdminAnomaliesQueue />
      </div>
    </main>
  );
}
