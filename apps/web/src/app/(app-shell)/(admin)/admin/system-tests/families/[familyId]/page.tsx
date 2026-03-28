"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { fetchAdminSystemTestFamilyDetail } from "@/lib/api/systemTestFamilies";

export default function AdminSystemTestFamilyDetailPage() {
  const params = useParams();
  const familyId = String(params?.familyId ?? "");

  const [token, setToken] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchAdminSystemTestFamilyDetail>> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getStoredAccessToken());
  }, []);

  useEffect(() => {
    if (!token || !familyId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await fetchAdminSystemTestFamilyDetail(token, familyId);
        if (!cancelled) setDetail(d);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load family.");
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, familyId]);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <p>
          <Link href="/admin/system-tests/families" className="text-sm text-sky-300 hover:text-sky-200">
            ← All families
          </Link>
        </p>

        {loading ? <p className="text-sm text-white/55">Loading…</p> : null}
        {error ? <p className="text-sm text-amber-200/90">{error}</p> : null}

        {detail ?
          <>
            <header className="space-y-2">
              <h1 className="text-2xl font-semibold">{detail.displayTitle}</h1>
              <p className="text-sm text-white/65">{detail.rootCauseSummary}</p>
              <div className="flex flex-wrap gap-2 text-xs text-white/50">
                <span>Status: {detail.status}</span>
                <span>·</span>
                <span>Trend: {detail.trendKind}</span>
                <span>·</span>
                <span>{detail.recurrenceLine ?? "—"}</span>
                <span>·</span>
                <span>
                  Runs {detail.affectedRunCount}, files {detail.affectedFileCount}, occ{" "}
                  {detail.totalOccurrencesAcrossRuns}
                </span>
              </div>
            </header>

            {detail.incident ?
              <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-4 text-sm text-teal-50">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/70">Incident</p>
                <p className="mt-1">
                  <Link
                    href={`/admin/system-tests/incidents/${encodeURIComponent(detail.incident.incidentKey)}`}
                    className="text-teal-200 underline decoration-teal-500/40 hover:decoration-teal-200"
                  >
                    {detail.incident.displayTitle}
                  </Link>
                </p>
                <p className="mt-1 text-xs text-teal-100/75">
                  Severity {detail.incident.severity} · status {detail.incident.status} · role{" "}
                  {detail.incident.role}
                </p>
              </div>
            : null}

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-white/90">Recent memberships</h2>
              <ul className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                {detail.memberships.map((m) => (
                  <li key={`${m.runId}-${m.failureGroupId}`} className="border-b border-white/5 pb-3 last:border-0">
                    <p className="font-mono text-xs text-white/45">
                      run {m.runId.slice(0, 10)}… · {m.matchBasis}
                    </p>
                    <p className="text-sm text-white/85">{m.title}</p>
                    <p className="text-xs text-white/50">{m.file}</p>
                    <Link
                      href={`/admin/system-tests/${m.runId}`}
                      className="mt-1 inline-block text-xs text-sky-300 hover:text-sky-200"
                    >
                      Open run
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        : null}
      </div>
    </main>
  );
}
