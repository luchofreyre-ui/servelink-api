"use client";

import { AdminLaunchReadinessCard } from "@/components/admin/AdminLaunchReadinessCard";
import { AdminBookingRevenueReadinessCard } from "@/components/admin/AdminBookingRevenueReadinessCard";
import { AdminAnomaliesQueue } from "@/components/admin/anomalies/AdminAnomaliesQueue";
import { AdminOpsAnomaliesPanel } from "@/components/admin/AdminOpsAnomaliesPanel";

export default function AdminAnomaliesPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin anomalies &amp; ops queues
          </h1>
          <p className="max-w-3xl text-sm text-white/70">
            This page shows <strong>two different systems</strong>: a fingerprinted{" "}
            <em>ops anomaly</em> queue (alerts + SLA + ownership) and a separate{" "}
            <em>payment / Prisma ops anomaly</em> list. They use different API endpoints and
            data models—treat them as independent work queues.
          </p>
        </div>

        <AdminLaunchReadinessCard />
        <AdminBookingRevenueReadinessCard />

        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              1. Ops anomaly queue (fingerprints)
            </h2>
            <p className="mt-1 text-sm text-white/65">
              Source:{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-xs text-emerald-100/90">
                GET /api/v1/admin/ops/anomalies
              </code>
              . Fingerprinted ops alerts with filters in the URL, &ldquo;Load more&rdquo;
              pagination, and links into booking command center where applicable.
            </p>
          </div>
          <AdminAnomaliesQueue />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              2. Payment &amp; Prisma ops anomalies
            </h2>
            <p className="mt-1 text-sm text-white/65">
              Source:{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-xs text-cyan-100/90">
                GET /api/v1/admin/anomalies
              </code>
              . Operational records such as payment / intent issues—acknowledge or resolve
              here. This is <strong>not</strong> the fingerprinted queue in section 1.
            </p>
          </div>
          <AdminOpsAnomaliesPanel />
        </section>
      </div>
    </main>
  );
}
