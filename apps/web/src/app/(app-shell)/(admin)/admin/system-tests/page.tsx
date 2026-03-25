"use client";

import { SystemTestDashboard } from "@/components/admin/system-tests/SystemTestDashboard";

export default function AdminSystemTestsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">System Test Dashboard</h1>
          <p className="max-w-3xl text-sm text-white/70">
            Playwright (and other) system test runs ingested via{" "}
            <code className="rounded bg-black/40 px-1 py-0.5 text-xs text-emerald-100/90">
              POST /api/v1/admin/system-tests/report
            </code>
            . Summary, recent runs, and failure highlights for the latest run.
          </p>
        </div>
        <SystemTestDashboard />
      </div>
    </main>
  );
}
