import { Suspense } from "react";
import { AdminAuthorityAlertsClient } from "@/components/admin/authority-alerts/AdminAuthorityAlertsClient";

export default function AdminAuthorityAlertsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-950 px-6 py-12 text-sm text-white/55">
          Loading alerts…
        </main>
      }
    >
      <AdminAuthorityAlertsClient />
    </Suspense>
  );
}
