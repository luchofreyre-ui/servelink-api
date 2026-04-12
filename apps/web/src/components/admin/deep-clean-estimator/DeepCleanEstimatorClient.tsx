"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DeepCleanEstimatorConfigPayloadApi } from "@/types/deepCleanEstimatorConfig";
import type { DeepCleanEstimatorPreviewResponseApi } from "@/types/deepCleanEstimatorConfig";
import {
  fetchAdminDeepCleanEstimatorActiveConfig,
  fetchAdminDeepCleanEstimatorDraftConfig,
  previewAdminDeepCleanEstimatorConfig,
  publishAdminDeepCleanEstimatorDraft,
  updateAdminDeepCleanEstimatorDraftConfig,
} from "@/lib/api/bookings";
import { getStoredAccessToken } from "@/lib/auth";
import {
  DEEP_CLEAN_ESTIMATOR_PREVIEW_PRESETS,
  type DeepCleanEstimatorPreviewPreset,
} from "./deepCleanEstimatorPreviewPresets";

function cloneConfig(c: DeepCleanEstimatorConfigPayloadApi): DeepCleanEstimatorConfigPayloadApi {
  return {
    ...c,
    visitDurationMultipliers: { ...c.visitDurationMultipliers },
  };
}

function ConfigFields(props: {
  title: string;
  config: DeepCleanEstimatorConfigPayloadApi;
  disabled?: boolean;
  onChange?: (next: DeepCleanEstimatorConfigPayloadApi) => void;
}) {
  const { title, config, disabled, onChange } = props;
  const set = (patch: Partial<DeepCleanEstimatorConfigPayloadApi>) => {
    if (!onChange) return;
    onChange({ ...config, ...patch });
  };
  const setVisit = (patch: Partial<DeepCleanEstimatorConfigPayloadApi["visitDurationMultipliers"]>) => {
    if (!onChange) return;
    onChange({
      ...config,
      visitDurationMultipliers: { ...config.visitDurationMultipliers, ...patch },
    });
  };

  const num = (
    label: string,
    value: number,
    onPatch: (v: number) => void,
    step = 0.05,
  ) => (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        type="number"
        step={step}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        disabled={disabled}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onPatch(Number(e.target.value))}
      />
    </label>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {num("Global duration multiplier", config.globalDurationMultiplier, (v) =>
          set({ globalDurationMultiplier: v }),
        )}
        {num("Single-visit duration multiplier", config.singleVisitDurationMultiplier, (v) =>
          set({ singleVisitDurationMultiplier: v }),
        )}
        {num("Three-visit duration multiplier", config.threeVisitDurationMultiplier, (v) =>
          set({ threeVisitDurationMultiplier: v }),
        )}
        {num("Visit 1 multiplier", config.visitDurationMultipliers.visit1, (v) =>
          setVisit({ visit1: v }),
        )}
        {num("Visit 2 multiplier", config.visitDurationMultipliers.visit2, (v) =>
          setVisit({ visit2: v }),
        )}
        {num("Visit 3 multiplier", config.visitDurationMultipliers.visit3, (v) =>
          setVisit({ visit3: v }),
        )}
        {num("Bedroom additive (min / bedroom)", config.bedroomAdditiveMinutes, (v) =>
          set({ bedroomAdditiveMinutes: v }),
        1)}
        {num("Bathroom additive (min / bath)", config.bathroomAdditiveMinutes, (v) =>
          set({ bathroomAdditiveMinutes: v }),
        1)}
        {num("Pet additive (min, if pets)", config.petAdditiveMinutes, (v) =>
          set({ petAdditiveMinutes: v }),
        1)}
        {num("Kitchen heavy-soil additive (min)", config.kitchenHeavySoilAdditiveMinutes, (v) =>
          set({ kitchenHeavySoilAdditiveMinutes: v }),
        1)}
        {num("Minimum visit duration (minutes)", config.minimumVisitDurationMinutes, (v) =>
          set({ minimumVisitDurationMinutes: Math.round(v) }),
        1)}
        {num("Minimum program duration (minutes)", config.minimumProgramDurationMinutes, (v) =>
          set({ minimumProgramDurationMinutes: Math.round(v) }),
        1)}
      </div>
    </div>
  );
}

export function DeepCleanEstimatorClient() {
  const [active, setActive] = useState<{
    version: number;
    label: string;
    config: DeepCleanEstimatorConfigPayloadApi;
    publishedAt: string | null;
  } | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftConfig, setDraftConfig] = useState<DeepCleanEstimatorConfigPayloadApi | null>(null);
  const [draftVersion, setDraftVersion] = useState<number | null>(null);
  const [presetId, setPresetId] = useState<string>(DEEP_CLEAN_ESTIMATOR_PREVIEW_PRESETS[0]?.id ?? "");
  const [preview, setPreview] = useState<DeepCleanEstimatorPreviewResponseApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishOk, setPublishOk] = useState<{
    publishedVersion: number;
    newDraftVersion: number;
  } | null>(null);

  const selectedPreset: DeepCleanEstimatorPreviewPreset | undefined = useMemo(
    () => DEEP_CLEAN_ESTIMATOR_PREVIEW_PRESETS.find((p) => p.id === presetId),
    [presetId],
  );

  const load = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in at /admin/auth with an admin account.");
      setActive(null);
      setDraftConfig(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [a, d] = await Promise.all([
        fetchAdminDeepCleanEstimatorActiveConfig(),
        fetchAdminDeepCleanEstimatorDraftConfig(),
      ]);
      setActive({
        version: a.row.version,
        label: a.row.label,
        config: a.row.config,
        publishedAt: a.row.publishedAt,
      });
      setDraftLabel(d.row.label);
      setDraftConfig(cloneConfig(d.row.config));
      setDraftVersion(d.row.version);
      setPublishOk(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load estimator config.");
      setActive(null);
      setDraftConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runPreview = async () => {
    if (!selectedPreset) return;
    setError(null);
    try {
      const p = await previewAdminDeepCleanEstimatorConfig(selectedPreset.estimateInput);
      setPreview(p);
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Preview failed.");
    }
  };

  const saveDraft = async () => {
    if (!draftConfig) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateAdminDeepCleanEstimatorDraftConfig({
        label: draftLabel || undefined,
        config: draftConfig,
      });
      setDraftLabel(res.row.label);
      setDraftConfig(cloneConfig(res.row.config));
      setDraftVersion(res.row.version);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save draft failed.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await publishAdminDeepCleanEstimatorDraft();
      setPublishOpen(false);
      setPublishOk({
        publishedVersion: res.published.version,
        newDraftVersion: res.newDraft.version,
      });
      await load();
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Deep Clean Estimator</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Human-controlled tuning for deep clean labor estimates. Use{" "}
          <Link href="/admin/deep-clean/insights" className="text-blue-700 underline">
            Deep Clean Insights
          </Link>{" "}
          for patterns,{" "}
          <Link href="/admin/deep-clean/analytics" className="text-blue-700 underline">
            Deep Clean Analytics
          </Link>{" "}
          for booking-level review, and{" "}
          <Link href="/admin/deep-clean/estimator-impact" className="text-blue-700 underline">
            Estimator impact
          </Link>{" "}
          to compare outcomes by published version, and{" "}
          <Link href="/admin/deep-clean/estimator-governance" className="text-blue-700 underline">
            Estimator governance
          </Link>{" "}
          for version history, restore-to-draft, rollback readiness, decision intelligence, and operational
          monitoring.
        </p>
        <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <Link href="/admin" className="text-blue-700 hover:underline">
            Admin home
          </Link>
          <Link href="/admin/deep-clean/estimator-impact" className="text-blue-700 hover:underline">
            Estimator impact
          </Link>
          <Link
            href="/admin/deep-clean/estimator-governance"
            className="text-blue-700 hover:underline"
            data-testid="deep-clean-estimator-link-governance"
          >
            Estimator governance
          </Link>
        </p>
      </div>

      <div
        className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        data-testid="deep-clean-estimator-safety-copy"
      >
        <p className="font-semibold">Publishing affects future estimates only</p>
        <p className="mt-1 text-amber-900">
          Historical bookings, estimate snapshots, calibration rows, and reviews are never rewritten.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      {publishOk ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Published estimator config version {publishOk.publishedVersion}. New Draft config version{" "}
          {publishOk.newDraftVersion} is ready to edit.
        </div>
      ) : null}

      {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}

      {!loading && active ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Active config</h2>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <p>
              <span className="font-medium">Version:</span> {active.version}
            </p>
            <p>
              <span className="font-medium">Label:</span> {active.label}
            </p>
            <p>
              <span className="font-medium">Published:</span>{" "}
              {active.publishedAt ? new Date(active.publishedAt).toLocaleString() : "—"}
            </p>
          </div>
          <ConfigFields title="Active tuning values" config={active.config} disabled />
        </section>
      ) : null}

      {!loading && draftConfig ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Draft config</h2>
          <label className="flex max-w-md flex-col gap-1 text-sm text-slate-700">
            <span className="text-xs font-medium text-slate-500">Draft label</span>
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={draftLabel}
              disabled={saving}
              onChange={(e) => setDraftLabel(e.target.value)}
            />
          </label>
          <p className="text-xs text-slate-500">Draft version {draftVersion ?? "—"}</p>
          <ConfigFields title="Draft tuning values" config={draftConfig} disabled={saving} onChange={setDraftConfig} />
          <button
            type="button"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => void saveDraft()}
          >
            Save draft
          </button>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
        <p className="text-sm text-slate-600">
          Compare Active config vs Draft config on the same sample input (not persisted).
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="text-xs font-medium text-slate-500">Sample scenario</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
            >
              {DEEP_CLEAN_ESTIMATOR_PREVIEW_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
            onClick={() => void runPreview()}
          >
            Run preview
          </button>
        </div>

        {preview ? (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Estimated duration delta</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Active config</p>
                <p className="mt-1 text-sm">
                  v{preview.active.version} — {preview.active.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{preview.active.totalEstimatedDurationMinutes} min</p>
                <p className="text-xs text-slate-500">
                  Visits: {preview.active.perVisitDurationMinutes.join(" / ")} min
                </p>
                <p className="text-xs text-slate-500">Price cents: {preview.active.estimatedPriceCents}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Draft config</p>
                <p className="mt-1 text-sm">
                  v{preview.draft.version} — {preview.draft.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{preview.draft.totalEstimatedDurationMinutes} min</p>
                <p className="text-xs text-slate-500">
                  Visits: {preview.draft.perVisitDurationMinutes.join(" / ")} min
                </p>
                <p className="text-xs text-slate-500">Price cents: {preview.draft.estimatedPriceCents}</p>
              </div>
            </div>
            <p className="text-sm text-slate-800">
              Δ minutes: <span className="font-semibold">{preview.deltaMinutes}</span>
              {preview.deltaPercent != null ? (
                <>
                  {" "}
                  (Δ%: <span className="font-semibold">{preview.deltaPercent}%</span>)
                </>
              ) : null}
            </p>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Publish estimator config</h2>
        <button
          type="button"
          disabled={saving || !draftConfig}
          className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={() => setPublishOpen(true)}
        >
          Publish estimator config…
        </button>

        {publishOpen ? (
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Confirm publish</p>
            <p className="mt-2 text-sm text-slate-700" data-testid="deep-clean-estimator-publish-confirm-copy">
              Publishing affects future estimates only. Current Active config will be archived; Draft config becomes
              Active; a new Draft will be created from the published settings.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                disabled={saving}
                className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                onClick={() => void publish()}
              >
                Confirm publish
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800"
                onClick={() => setPublishOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
