"use client";

import { useParams } from "next/navigation";
import { SystemTestRunDetailView } from "@/components/admin/system-tests/SystemTestRunDetailView";

export default function AdminSystemTestRunDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        {id ? (
          <SystemTestRunDetailView runId={id} />
        ) : (
          <p className="text-sm text-white/60">Missing run id.</p>
        )}
      </div>
    </main>
  );
}
