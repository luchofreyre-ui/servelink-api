import { Suspense } from "react";
import { AdminAuthorityDriftClient } from "@/components/admin/authority-drift/AdminAuthorityDriftClient";

export default function AdminAuthorityDriftPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-950 px-6 py-12 text-sm text-white/55">
          Loading drift…
        </main>
      }
    >
      <AdminAuthorityDriftClient />
    </Suspense>
  );
}
