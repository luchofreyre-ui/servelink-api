"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildEstimatorDecisionDashboard } from "@/analytics/deep-clean/deepCleanEstimatorDecisionSelectors";
import {
  getActiveVersion,
  getArchivedVersions,
  getDraftVersion,
  getRollbackReadyCandidates,
} from "@/analytics/deep-clean/deepCleanEstimatorGovernanceSelectors";
import {
  fetchAdminDeepCleanEstimatorActiveConfig,
  fetchAdminDeepCleanEstimatorConfigDetail,
  fetchAdminDeepCleanEstimatorConfigHistory,
  fetchAdminDeepCleanEstimatorImpact,
  restoreAdminDeepCleanEstimatorConfigToDraft,
} from "@/lib/api/bookings";
import { getStoredAccessToken } from "@/lib/auth";
import {
  governanceStatusBadgeClass,
  governanceStatusLabel,
} from "@/mappers/deepCleanEstimatorGovernanceMappers";
import type { DeepCleanEstimatorConfigRowApi } from "@/types/deepCleanEstimatorConfig";
import type {
  DeepCleanEstimatorVersionDetailApi,
  DeepCleanEstimatorVersionHistoryRowApi,
} from "@/types/deepCleanEstimatorGovernance";
import type { DeepCleanEstimatorVersionImpactRowApi } from "@/types/deepCleanEstimatorImpact";
import { DeepCleanEstimatorDecisionSummary } from "./DeepCleanEstimatorDecisionSummary";

const COMPARE_KEYS: Array<{ key: keyof DeepCleanEstimatorConfigRowApi["config"]; label: string }> = [
  { key: "globalDurationMultiplier", label: "globalDurationMultiplier" },
  { key: "singleVisitDurationMultiplier", label: "singleVisitDurationMultiplier" },
  { key: "threeVisitDurationMultiplier", label: "threeVisitDurationMultiplier" },
  { key: "bedroomAdditiveMinutes", label: "bedroomAdditiveMinutes" },
  { key: "bathroomAdditiveMinutes", label: "bathroomAdditiveMinutes" },
  { key: "petAdditiveMinutes", label: "petAdditiveMinutes" },
  { key: "kitchenHeavySoilAdditiveMinutes", label: "kitchenHeavySoilAdditiveMinutes" },
  { key: "minimumVisitDurationMinutes", label: "minimumVisitDurationMinutes" },
  { key: "minimumProgramDurationMinutes", label: "minimumProgramDurationMinutes" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function DeepCleanEstimatorGovernanceClient() {
  const searchParams = useSearchParams();
  const [historyRows, setHistoryRows] = useState<DeepCleanEstimatorVersionHistoryRowApi[]>([]);
  const [activeRow, setActiveRow] = useState<DeepCleanEstimatorConfigRowApi | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DeepCleanEstimatorVersionDetailApi | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<DeepCleanEstimatorVersionHistoryRowApi | null>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [impactRows, setImpactRows] = useState<DeepCleanEstimatorVersionImpactRowApi[]>([]);
  const [impactUnavailable, setImpactUnavailable] = useState(false);

  const active = useMemo(() => getActiveVersion(historyRows), [historyRows]);
  const draft = useMemo(() => getDraftVersion(historyRows), [historyRows]);
  const archived = useMemo(() => getArchivedVersions(historyRows), [historyRows]);
  const rollbackCandidates = useMemo(() => getRollbackReadyCandidates(historyRows), [historyRows]);

  const loadCore = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in at /admin/auth with an admin account.");
      setHistoryRows([]);
      setActiveRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [hist, act] = await Promise.all([
        fetchAdminDeepCleanEstimatorConfigHistory(),
        fetchAdminDeepCleanEstimatorActiveConfig(),
      ]);
      setHistoryRows(hist.rows);
      setActiveRow(act.row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load governance data.");
      setHistoryRows([]);
      setActiveRow(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (loading || error) return;
    if (historyRows.length === 0) return;
    const token = getStoredAccessToken();
    if (!token) return;
    let cancelled = false;
    void fetchAdminDeepCleanEstimatorImpact({ reviewedOnly: false, usableOnly: false })
      .then((res) => {
        if (!cancelled) {
          setImpactRows(res.rows);
          setImpactUnavailable(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImpactRows([]);
          setImpactUnavailable(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loading, error, historyRows]);

  const decisionDashboard = useMemo(() => {
    if (impactUnavailable) return null;
    return buildEstimatorDecisionDashboard({ governanceRows: historyRows, impactRows });
  }, [historyRows, impactRows, impactUnavailable]);

  useEffect(() => {
    const v = searchParams?.get("version");
    if (!v || historyRows.length === 0) return;
    const match = historyRows.find((r) => String(r.version) === v);
    if (match) setSelectedId(match.id);
  }, [searchParams, historyRows]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    const token = getStoredAccessToken();
    if (!token) return;
    let cancelled = false;
    setDetailLoading(true);
    void fetchAdminDeepCleanEstimatorConfigDetail(selectedId)
      .then((res) => {
        if (!cancelled) setDetail(res.row);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const openRestore = (row: DeepCleanEstimatorVersionHistoryRowApi) => {
    setRestoreMessage(null);
    setRestoreTarget(row);
    setRestoreOpen(true);
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    setRestoreBusy(true);
    setRestoreMessage(null);
    try {
      const res = await restoreAdminDeepCleanEstimatorConfigToDraft(restoreTarget.id);
      setRestoreOpen(false);
      setRestoreTarget(null);
      setRestoreMessage(
        `Draft updated from v${res.restoredFromVersion}. Publish from the Estimator page when ready.`,
      );
      await loadCore();
      setSelectedId(res.draft.id);
    } catch (e) {
      setRestoreMessage(e instanceof Error ? e.message : "Restore failed.");
    } finally {
      setRestoreBusy(false);
    }
  };

  const canRestore = (row: DeepCleanEstimatorVersionHistoryRowApi) =>
    row.status === "active" || row.status === "archived";

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Deep Clean Estimator Governance</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Version history, restore-to-draft, and publish lineage. Rollback is forward-only: restoring never
          reactivates an old row; publishing creates a new active version.
        </p>
        <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <Link href="/admin" className="text-blue-700 hover:underline">
            Admin home
          </Link>
          <Link
            href="/admin/deep-clean/estimator"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-estimator-governance-link-estimator"
          >
            Deep Clean Estimator
          </Link>
          <Link
            href="/admin/deep-clean/estimator-impact"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-estimator-governance-link-impact"
          >
            Estimator impact
          </Link>
          <Link
            href="/admin/deep-clean/estimator-monitoring"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-estimator-governance-link-monitoring"
          >
            Open monitoring
          </Link>
        </p>
      </div>

      <div
        className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-800"
        data-testid="deep-clean-estimator-governance-safety-block"
      >
        <p className="font-semibold text-slate-900">Governance rules</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Restoring a version creates a new draft.</li>
          <li>Publishing affects future estimates only.</li>
          <li>Historical versions are never reactivated in place.</li>
        </ul>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      {restoreMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {restoreMessage}
        </div>
      ) : null}

      {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}

      {!loading && !error && historyRows.length > 0 && impactUnavailable ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          Decision intelligence is temporarily unavailable.
        </div>
      ) : null}

      {!loading && !error && historyRows.length > 0 && decisionDashboard ? (
        <DeepCleanEstimatorDecisionSummary
          dashboard={decisionDashboard}
          governanceRows={historyRows}
        />
      ) : null}

      {!loading && !error && historyRows.length > 0 ? (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Current state</h2>
            <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-500">Active</dt>
                <dd>
                  {active ? (
                    <>
                      v{active.version} · {active.label}
                      <br />
                      <span className="text-xs text-slate-500">{fmtDate(active.publishedAt)}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Draft</dt>
                <dd>{draft ? `v${draft.version} · ${draft.label}` : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Archived count</dt>
                <dd>{archived.length}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Rollback-ready candidates</dt>
                <dd>{rollbackCandidates.length}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Version history</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table
                className="min-w-full border-collapse text-left text-sm"
                data-testid="deep-clean-estimator-governance-history-table"
              >
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                    <th className="px-3 py-2">Version</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Label</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Published</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b border-slate-100 ${selectedId === r.id ? "bg-blue-50/60" : ""}`}
                    >
                      <td className="px-3 py-2 font-mono text-xs">v{r.version}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${governanceStatusBadgeClass(r.status)}`}
                        >
                          {governanceStatusLabel(r.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">{r.label}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{fmtDate(r.createdAt)}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{fmtDate(r.publishedAt)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-xs font-medium text-blue-700 underline"
                            onClick={() => setSelectedId(r.id)}
                          >
                            View
                          </button>
                          {canRestore(r) ? (
                            <button
                              type="button"
                              className="text-xs font-medium text-amber-800 underline"
                              onClick={() => openRestore(r)}
                            >
                              Restore to draft
                            </button>
                          ) : null}
                          <Link
                            href={`/admin/deep-clean/estimator-impact?version=${r.version}`}
                            className="text-xs font-medium text-slate-600 underline"
                          >
                            Impact
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            data-testid="deep-clean-estimator-governance-detail-section"
          >
            <h2 className="text-lg font-semibold text-slate-900">Selected version detail</h2>
            {!selectedId ? (
              <p className="text-sm text-slate-600">Select a row with View.</p>
            ) : detailLoading ? (
              <p className="text-sm text-slate-600">Loading detail…</p>
            ) : !detail ? (
              <p className="text-sm text-slate-600">Could not load detail.</p>
            ) : (
              <>
                <div className="text-sm text-slate-700">
                  <p>
                    <span className="font-medium">v{detail.version}</span> · {detail.label} ·{" "}
                    {governanceStatusLabel(detail.status)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    id {detail.id} · updated {fmtDate(detail.updatedAt)}
                  </p>
                </div>

                {activeRow && detail.id !== activeRow.id ? (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Active (v{activeRow.version}) vs selected (v{detail.version})
                    </h3>
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-1 pr-4">Field</th>
                            <th className="py-1 pr-4">Active</th>
                            <th className="py-1">Selected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {COMPARE_KEYS.map(({ key, label }) => (
                            <tr key={label} className="border-b border-slate-100">
                              <td className="py-1 pr-4 font-mono text-slate-600">{label}</td>
                              <td className="py-1 pr-4 font-mono">{String(activeRow.config[key])}</td>
                              <td className="py-1 font-mono">{String(detail.config[key])}</td>
                            </tr>
                          ))}
                          <tr className="border-b border-slate-100">
                            <td className="py-1 pr-4 font-mono text-slate-600">visitDurationMultipliers</td>
                            <td className="py-1 pr-4 font-mono text-[10px]">
                              {JSON.stringify(activeRow.config.visitDurationMultipliers)}
                            </td>
                            <td className="py-1 font-mono text-[10px]">
                              {JSON.stringify(detail.config.visitDurationMultipliers)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                <pre className="mt-4 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-3 text-xs text-slate-100">
                  {JSON.stringify(detail.config, null, 2)}
                </pre>
              </>
            )}
          </section>
        </>
      ) : null}

      {restoreOpen && restoreTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-modal-title"
          data-testid="deep-clean-estimator-governance-restore-modal"
        >
          <div className="max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 id="restore-modal-title" className="text-lg font-semibold text-slate-900">
              Restore v{restoreTarget.version} to draft?
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
              <li>The current draft will be replaced with this configuration.</li>
              <li>Source version v{restoreTarget.version} stays unchanged in history.</li>
              <li>Restore does not publish.</li>
            </ul>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
                disabled={restoreBusy}
                onClick={() => {
                  setRestoreOpen(false);
                  setRestoreTarget(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={restoreBusy}
                onClick={() => void confirmRestore()}
              >
                {restoreBusy ? "Restoring…" : "Restore to draft"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
