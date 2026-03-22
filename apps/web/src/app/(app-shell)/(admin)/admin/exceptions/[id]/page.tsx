"use client";

import { useParams } from "next/navigation";

export default function AdminDispatchExceptionDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");

  return (
    <div className="space-y-4 p-6 text-white">
      <h1 className="text-xl font-semibold">Dispatch exception</h1>
      <p className="text-sm text-white/70">
        Booking <span className="font-mono">{id}</span> — exception reasons and
        dispatch status for triage.
      </p>
    </div>
  );
}
