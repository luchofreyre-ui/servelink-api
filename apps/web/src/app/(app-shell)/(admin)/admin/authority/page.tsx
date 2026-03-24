import Link from "next/link";

export default function AdminAuthorityIntelHubPage() {
  return (
    <main
      className="min-h-screen bg-neutral-950 px-6 py-10 text-white"
      data-testid="admin-authority-hub-page"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Admin · Operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Authority intelligence</h1>
          <p className="mt-2 text-sm text-white/65">
            Classifier health, drift, alerts, and franchise-owner feedback on recommended knowledge.
          </p>
        </div>

        <ul className="space-y-4 text-sm">
          <li className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <Link
              href="/admin/authority/report"
              className="font-semibold text-emerald-100/95 underline decoration-white/20 underline-offset-4 hover:text-white"
              data-testid="admin-authority-hub-link-report"
            >
              Tag frequency report
            </Link>
            <p className="mt-1 text-xs text-white/50">
              Persisted tag distributions and a sample of booking authority rows.
            </p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <Link
              href="/admin/authority/quality"
              className="font-semibold text-emerald-100/95 underline decoration-white/20 underline-offset-4 hover:text-white"
              data-testid="admin-authority-hub-link-quality"
            >
              Quality &amp; FO feedback
            </Link>
            <p className="mt-1 text-xs text-white/50">
              Review/override rates, mismatch mix, drift signals, and recent franchise-owner
              usefulness signals.
            </p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <Link
              href="/admin/authority/drift"
              className="font-semibold text-emerald-100/95 underline decoration-white/20 underline-offset-4 hover:text-white"
              data-testid="admin-authority-hub-link-drift"
            >
              Drift review
            </Link>
            <p className="mt-1 text-xs text-white/50">
              Unstable tags, mismatch-heavy types, and override-heavy patterns.
            </p>
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <Link
              href="/admin/authority/alerts"
              className="font-semibold text-emerald-100/95 underline decoration-white/20 underline-offset-4 hover:text-white"
              data-testid="admin-authority-hub-link-alerts"
            >
              Threshold alerts
            </Link>
            <p className="mt-1 text-xs text-white/50">
              Deterministic checks for override spikes, low review rates, mismatch bursts, and tag
              instability.
            </p>
          </li>
        </ul>
      </div>
    </main>
  );
}
