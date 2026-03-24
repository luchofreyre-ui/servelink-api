import { Suspense } from "react";
import { AdminAuthorityReportClient } from "@/components/admin/authority-report/AdminAuthorityReportClient";

export default function AdminAuthorityReportPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-950 px-6 py-12 text-sm text-white/55">
          Loading report…
        </main>
      }
    >
      <AdminAuthorityReportClient />
    </Suspense>
  );
}
