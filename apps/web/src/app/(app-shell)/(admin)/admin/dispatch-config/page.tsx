"use client";

export default function AdminDispatchConfigPage() {
  return (
    <div className="space-y-4 p-6 text-white">
      <h1 className="text-xl font-semibold">Dispatch config</h1>
      <p className="text-sm text-white/70">
        Configure dispatch weights, offer expiry minutes, and assigned start grace
        windows. Compare active vs draft versions before publish.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
        <p>Active and draft dispatch config versions appear here.</p>
      </div>
    </div>
  );
}
