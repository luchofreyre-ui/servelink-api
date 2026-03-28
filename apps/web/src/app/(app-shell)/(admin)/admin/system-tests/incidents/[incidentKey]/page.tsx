import { Suspense } from "react";
import { SystemTestIncidentDetailWorkspace } from "@/components/admin/system-tests/SystemTestIncidentDetailWorkspace";

export default function AdminSystemTestIncidentDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
          <p className="text-sm text-white/55">Loading…</p>
        </main>
      }
    >
      <SystemTestIncidentDetailWorkspace />
    </Suspense>
  );
}
