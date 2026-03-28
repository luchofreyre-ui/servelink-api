import { Suspense } from "react";
import { DispatchExceptionActionDetailWorkspace } from "@/components/admin/dispatch-exceptions/DispatchExceptionActionDetailWorkspace";

export default function AdminDispatchExceptionActionDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
          <p className="text-sm text-white/55">Loading…</p>
        </main>
      }
    >
      <DispatchExceptionActionDetailWorkspace />
    </Suspense>
  );
}
