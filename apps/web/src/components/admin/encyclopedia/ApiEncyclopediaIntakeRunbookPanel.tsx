"use client";

export default function ApiEncyclopediaIntakeRunbookPanel() {
  return (
    <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Operational Intake Runbook</h2>

      <div className="rounded-lg border bg-neutral-50 p-3 text-sm text-neutral-700">
        New canonical generation output should go directly into the API review
        store. Use the intake CLI from <code>apps/web</code>, then review,
        approve, and promote from the API-backed admin pages.
      </div>

      <pre className="overflow-auto rounded-lg border bg-neutral-50 p-3 text-xs">
        {`cd ~/Desktop/servelink/apps/web
SERVELINK_ACCESS_TOKEN=YOUR_TOKEN npm run intake:encyclopedia-generated-review-records -- --source=content-batches/encyclopedia/YOUR_FILE.json --api-base=http://localhost:3001`}
      </pre>

      <div className="text-xs text-neutral-500">
        Use export/import only for migration or backfill from the legacy corpus.
      </div>
    </section>
  );
}
