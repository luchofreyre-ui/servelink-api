"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { classifyEncyclopediaSearchIntentTitle } from "@/lib/encyclopedia/encyclopediaSearchIntentTitle";
import {
  filterReviewedCandidates,
  getEffectiveRecommendation,
  recommendationExplanation,
  summarizeReviewedCandidates,
  titleIntentKindForReviewRow,
  type EncyclopediaReviewedCandidateRow,
  type ReviewedCandidatesFile,
  type ReviewQueueFilters,
  type ReviewTriage,
} from "@/lib/encyclopedia/reviewedCandidatesQueue";
import {
  REVIEW_QUEUE_SOURCE_OPTIONS,
  type ReviewedCandidatesSourceKey,
} from "@/lib/encyclopedia/reviewedCandidatesSources";

type ApiGetResponse = {
  sourceKey: ReviewedCandidatesSourceKey;
  sourceLabel: string;
  file: ReviewedCandidatesFile;
  loadedFrom: "edited" | "original";
  sourcePath: string;
  editedPath: string;
  existingNormalizedSlugs: string[];
};

function updateRowOverride(
  file: ReviewedCandidatesFile,
  id: string,
  value: ReviewTriage | "clear",
): ReviewedCandidatesFile {
  const candidates = file.candidates.map((row) => {
    if (row.id !== id) {
      return row;
    }
    const next = { ...row } as EncyclopediaReviewedCandidateRow;
    if (value === "clear") {
      delete next.manualOverrideRecommendation;
      return next;
    }
    next.manualOverrideRecommendation = value;
    return next;
  });
  return {
    ...file,
    candidates,
    summary: summarizeReviewedCandidates(candidates),
  };
}

export function EncyclopediaReviewQueueClient() {
  const [sourceKey, setSourceKey] = useState<ReviewedCandidatesSourceKey>("standard");
  const [file, setFile] = useState<ReviewedCandidatesFile | null>(null);
  const [meta, setMeta] = useState<
    Pick<ApiGetResponse, "sourceKey" | "sourceLabel" | "loadedFrom" | "sourcePath" | "editedPath"> | null
  >(null);
  const [slugSet, setSlugSet] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<ReviewQueueFilters>({
    recommendation: "review",
    category: "all",
    cluster: "",
    warningCode: "",
    titleIntent: "all",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [forceOriginal, setForceOriginal] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setSaveMessage(null);
    try {
      const params = new URLSearchParams();
      params.set("sourceKey", sourceKey);
      if (forceOriginal) {
        params.set("source", "original");
      }
      const res = await fetch(`/api/admin/encyclopedia/reviewed-candidates?${params.toString()}`);
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? res.statusText);
      }
      const data = (await res.json()) as ApiGetResponse;
      setFile(data.file);
      setMeta({
        sourceKey: data.sourceKey,
        sourceLabel: data.sourceLabel,
        loadedFrom: data.loadedFrom,
        sourcePath: data.sourcePath,
        editedPath: data.editedPath,
      });
      setSlugSet(new Set(data.existingNormalizedSlugs));
    } catch (e) {
      setFile(null);
      setLoadError(e instanceof Error ? e.message : "Load failed");
    }
  }, [forceOriginal, sourceKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    if (!file) {
      return { total: 0, promote: 0, review: 0, reject: 0 };
    }
    return summarizeReviewedCandidates(file.candidates);
  }, [file]);

  const filtered = useMemo(() => {
    if (!file) {
      return [];
    }
    return filterReviewedCandidates(file.candidates, filters);
  }, [file, filters]);

  const warningOptions = useMemo(() => {
    if (!file) {
      return [];
    }
    const s = new Set<string>();
    for (const c of file.candidates) {
      for (const w of c.normalizationWarnings ?? []) {
        s.add(w);
      }
    }
    return [...s].sort();
  }, [file]);

  const selected = useMemo(() => {
    if (!file || !selectedId) {
      return null;
    }
    return file.candidates.find((c) => c.id === selectedId) ?? null;
  }, [file, selectedId]);

  const setDisposition = (id: string, value: ReviewTriage | "clear") => {
    setFile((f) => (f ? updateRowOverride(f, id, value) : f));
    setSaveMessage(null);
  };

  const rejectProblemLayerInFilteredRows = () => {
    setFile((f) => {
      if (!f) {
        return f;
      }
      const targetIds = new Set(
        filterReviewedCandidates(f.candidates, filters)
          .filter((r) => titleIntentKindForReviewRow(r) === "problem_layer")
          .map((r) => r.id),
      );
      if (targetIds.size === 0) {
        return f;
      }
      const candidates = f.candidates.map((row) =>
        targetIds.has(row.id) ? { ...row, manualOverrideRecommendation: "reject" as const } : row,
      );
      return { ...f, candidates, summary: summarizeReviewedCandidates(candidates) };
    });
    setSaveMessage(null);
  };

  const promoteSearchIntentInFilteredRows = () => {
    setFile((f) => {
      if (!f) {
        return f;
      }
      const targetIds = new Set(
        filterReviewedCandidates(f.candidates, filters)
          .filter(
            (r) =>
              titleIntentKindForReviewRow(r) === "search_intent" && getEffectiveRecommendation(r) !== "reject",
          )
          .map((r) => r.id),
      );
      if (targetIds.size === 0) {
        return f;
      }
      const candidates = f.candidates.map((row) =>
        targetIds.has(row.id) ? { ...row, manualOverrideRecommendation: "promote" as const } : row,
      );
      return { ...f, candidates, summary: summarizeReviewedCandidates(candidates) };
    });
    setSaveMessage(null);
  };

  const save = async () => {
    if (!file) {
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/admin/encyclopedia/reviewed-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceKey, file }),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        writtenPath?: string;
        error?: string;
        attempted?: number;
        created?: number;
        updated?: number;
        total?: number;
      };
      if (!res.ok) {
        throw new Error(j.error ?? res.statusText);
      }
      if (typeof j.attempted === "number") {
        setSaveMessage(
          `Synced ${j.attempted} row(s) to API review store (${j.created ?? 0} new, ${j.updated ?? 0} updated; ${j.total ?? "?"} total in store).`,
        );
      } else {
        setSaveMessage(`Saved ${j.writtenPath ?? "OK"}.`);
      }
      setMeta((m) => (m ? { ...m, loadedFrom: "edited" } : m));
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const changeSource = (next: ReviewedCandidatesSourceKey) => {
    setSourceKey(next);
    setSelectedId(null);
    setSaveMessage(null);
  };

  return (
    <main
      className="min-h-screen bg-neutral-950 px-6 py-10 text-white"
      data-testid="encyclopedia-review-queue-page"
    >
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
              Admin · Authority · Encyclopedia
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Encyclopedia review queue</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Triage reviewed index candidates. Overrides are stored as{" "}
              <code className="text-emerald-200/90">manualOverrideRecommendation</code>; pipeline{" "}
              <code className="text-emerald-200/90">recommendation</code> is unchanged. Pick a source lane
              below; saving syncs the current file view to the API encyclopedia review store (not local JSON).
            </p>
            <div
              className="mt-4 flex flex-wrap items-center gap-2"
              data-testid="encyclopedia-review-queue-source-selector"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Source</span>
              <div className="inline-flex rounded-lg border border-white/15 bg-black/40 p-0.5">
                {REVIEW_QUEUE_SOURCE_OPTIONS.map((opt) => {
                  const active = opt.sourceKey === sourceKey;
                  return (
                    <button
                      key={opt.sourceKey}
                      type="button"
                      onClick={() => changeSource(opt.sourceKey)}
                      data-testid={`encyclopedia-review-queue-source-${opt.sourceKey}`}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-emerald-600/35 text-emerald-50 ring-1 ring-emerald-500/40"
                          : "text-white/55 hover:bg-white/10 hover:text-white/85"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={forceOriginal}
                onChange={(e) => setForceOriginal(e.target.checked)}
                className="rounded border-white/20"
              />
              Load original (ignore edited)
            </label>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!file || saving}
              className="rounded-lg border border-emerald-500/40 bg-emerald-600/25 px-3 py-1.5 text-xs font-semibold text-emerald-50 hover:bg-emerald-600/40 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save to edited file"}
            </button>
          </div>
        </div>

        {meta ? (
          <div
            className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-xs text-white/55"
            data-testid="encyclopedia-review-queue-active-source"
          >
            <p className="font-semibold text-emerald-100/90">
              Active lane: {meta.sourceLabel}{" "}
              <span className="font-normal text-white/45">({meta.sourceKey})</span>
            </p>
            <p className="mt-1">
              Loaded from <span className="text-white/75">{meta.loadedFrom}</span> · canonical{" "}
              <code className="text-white/60">{meta.sourcePath}</code>
            </p>
            <p className="mt-0.5">
              Saves to edited{" "}
              <code className="text-amber-200/80">{meta.editedPath}</code>
            </p>
          </div>
        ) : null}
        {loadError ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {loadError}
          </p>
        ) : null}
        {saveMessage ? (
          <p className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
            {saveMessage}
          </p>
        ) : null}

        {sourceKey === "expanded" ? (
          <div
            className="rounded-xl border border-emerald-500/25 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-50/90"
            data-testid="encyclopedia-review-queue-expanded-intent-rules"
          >
            <p className="font-semibold text-emerald-100">Expanded lane: search-intent filter</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-emerald-100/80">
              <li>
                Prefer promoting titles that read like real Google queries and start with{" "}
                <span className="font-semibold text-emerald-50">Why</span>,{" "}
                <span className="font-semibold text-emerald-50">What</span>, or{" "}
                <span className="font-semibold text-emerald-50">How</span>.
              </li>
              <li>
                Treat symptom-on-surface lines (e.g. Heavy/Light/Severe … on …, or “[problem] on [surface]” without
                Why/What/How) as problem layer — reject, not promote.
              </li>
              <li>
                Use the Title intent filter. Many batches keep Why/What/How lines on{" "}
                <span className="font-semibold">review</span> while generic “method for surface” lines sit on{" "}
                <span className="font-semibold">promote</span> — override the intent rows to promote after filtering.
              </li>
              <li>
                “Promote search-intent (matches filters)” sets overrides for visible search-intent rows (skips
                effective rejects). Pair with recommendation = review + title intent = search intent to batch ~200–300
                promotes, then save.
              </li>
            </ul>
          </div>
        ) : null}

        {file ? (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs text-white/50">Total</p>
                <p className="text-2xl font-semibold">{counts.total}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <p className="text-xs text-emerald-200/70">Promote (effective)</p>
                <p className="text-2xl font-semibold text-emerald-100">{counts.promote}</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <p className="text-xs text-amber-200/70">Review (effective)</p>
                <p className="text-2xl font-semibold text-amber-50">{counts.review}</p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                <p className="text-xs text-rose-200/70">Reject (effective)</p>
                <p className="text-2xl font-semibold text-rose-50">{counts.reject}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 rounded-xl border border-white/10 bg-black/25 p-4">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-white/50">Recommendation</span>
                <select
                  value={filters.recommendation ?? "review"}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      recommendation: e.target.value as ReviewQueueFilters["recommendation"],
                    }))
                  }
                  className="rounded border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white"
                >
                  <option value="all">all</option>
                  <option value="review">review</option>
                  <option value="promote">promote</option>
                  <option value="reject">reject</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-white/50">Category</span>
                <select
                  value={filters.category ?? "all"}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      category: e.target.value as ReviewQueueFilters["category"],
                    }))
                  }
                  className="rounded border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white"
                >
                  <option value="all">all</option>
                  <option value="problems">problems</option>
                  <option value="methods">methods</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-white/50">Cluster contains</span>
                <input
                  value={filters.cluster ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, cluster: e.target.value }))}
                  className="w-48 rounded border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white"
                  placeholder="e.g. product-residue"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-white/50">Warning code</span>
                <select
                  value={filters.warningCode ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, warningCode: e.target.value }))}
                  className="rounded border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white"
                >
                  <option value="">(any)</option>
                  {warningOptions.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-white/50">Title intent</span>
                <select
                  value={filters.titleIntent ?? "all"}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      titleIntent: e.target.value as ReviewQueueFilters["titleIntent"],
                    }))
                  }
                  className="rounded border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white"
                  data-testid="encyclopedia-review-queue-title-intent-filter"
                >
                  <option value="all">all</option>
                  <option value="search_intent">search intent (Why/What/How)</option>
                  <option value="problem_layer">problem layer</option>
                  <option value="ambiguous">ambiguous</option>
                </select>
              </label>
            </div>

            {sourceKey === "expanded" ? (
              <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => promoteSearchIntentInFilteredRows()}
                  disabled={!file}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-600/25 px-3 py-1.5 text-xs font-semibold text-emerald-50 hover:bg-emerald-600/40 disabled:opacity-40"
                  data-testid="encyclopedia-review-queue-bulk-promote-search-intent"
                >
                  Promote search-intent (matches filters)
                </button>
                <button
                  type="button"
                  onClick={() => rejectProblemLayerInFilteredRows()}
                  disabled={!file}
                  className="rounded-lg border border-rose-500/35 bg-rose-600/20 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-600/30 disabled:opacity-40"
                  data-testid="encyclopedia-review-queue-bulk-reject-problem-layer"
                >
                  Reject problem-layer (matches filters)
                </button>
                <span className="text-[11px] text-white/45 sm:max-w-xl">
                  Bulk actions respect every filter above. Promote skips rows already effectively rejected.
                </span>
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[1100px] text-left text-xs">
                  <thead className="border-b border-white/10 bg-black/40 text-white/55">
                    <tr>
                      <th className="p-2 font-semibold">ID</th>
                      <th className="p-2 font-semibold">Cat</th>
                      <th className="p-2 font-semibold">Cluster</th>
                      <th className="p-2 font-semibold">Intent</th>
                      <th className="p-2 font-semibold">Raw title</th>
                      <th className="p-2 font-semibold">Raw slug</th>
                      <th className="p-2 font-semibold">Norm title</th>
                      <th className="p-2 font-semibold">Norm slug</th>
                      <th className="p-2 font-semibold">Master?</th>
                      <th className="p-2 font-semibold">Scorer</th>
                      <th className="p-2 font-semibold">Pipeline</th>
                      <th className="p-2 font-semibold">Final</th>
                      <th className="p-2 font-semibold">Norm action</th>
                      <th className="p-2 font-semibold">Warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const eff = getEffectiveRecommendation(row);
                      const active = row.id === selectedId;
                      const inMaster = slugSet.has(row.normalizedSlug);
                      const warn = (row.normalizationWarnings ?? []).join(", ");
                      const intentLabel = titleIntentKindForReviewRow(row);
                      const intentClass =
                        intentLabel === "search_intent"
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
                          : intentLabel === "problem_layer"
                            ? "border-rose-500/40 bg-rose-500/15 text-rose-100"
                            : "border-amber-500/35 bg-amber-500/10 text-amber-100";
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
                          className={`cursor-pointer border-b border-white/5 hover:bg-white/5 ${
                            active ? "bg-emerald-500/10" : ""
                          }`}
                        >
                          <td className="p-2 font-mono text-[10px] text-white/80">{row.id}</td>
                          <td className="p-2 text-white/70">{row.category}</td>
                          <td className="max-w-[120px] truncate p-2 text-white/60" title={row.cluster}>
                            {row.cluster}
                          </td>
                          <td className="p-2">
                            <span
                              className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${intentClass}`}
                            >
                              {intentLabel.replace("_", " ")}
                            </span>
                          </td>
                          <td className="max-w-[160px] truncate p-2 text-white/75" title={row.title}>
                            {row.title}
                          </td>
                          <td className="max-w-[120px] truncate p-2 font-mono text-[10px] text-white/65" title={row.slug}>
                            {row.slug}
                          </td>
                          <td className="max-w-[140px] truncate p-2 text-white/75" title={row.normalizedTitle}>
                            {row.normalizedTitle}
                          </td>
                          <td className="max-w-[120px] truncate p-2 font-mono text-[10px] text-emerald-200/80" title={row.normalizedSlug}>
                            {row.normalizedSlug}
                          </td>
                          <td className="p-2 text-white/60">{inMaster ? "yes" : "no"}</td>
                          <td className="p-2 text-white/70">{row.scorerRecommendation}</td>
                          <td className="p-2 text-white/70">{row.recommendation}</td>
                          <td className="p-2 font-semibold text-white/90">{eff}</td>
                          <td className="max-w-[100px] truncate p-2 text-white/60" title={row.normalizationAction}>
                            {row.normalizationAction}
                          </td>
                          <td className="max-w-[180px] truncate p-2 text-amber-200/70" title={warn}>
                            {warn || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="border-t border-white/10 px-3 py-2 text-xs text-white/45">
                  Showing {filtered.length} row(s) · effective recommendation filter applied
                </p>
              </div>

              <aside className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4">
                <h2 className="text-sm font-semibold text-white/90">Detail</h2>
                {!selected ? (
                  <p className="text-xs text-white/45">Select a row.</p>
                ) : (
                  <>
                    <dl className="space-y-2 text-xs">
                      <div>
                        <dt className="text-white/45">Title intent (heuristic)</dt>
                        <dd className="text-white/85">
                          {(() => {
                            const label =
                              selected.normalizedTitle?.trim() ? selected.normalizedTitle : selected.title;
                            const { kind, code } = classifyEncyclopediaSearchIntentTitle(label);
                            return (
                              <span className="text-white/70">
                                {kind.replace("_", " ")} <span className="text-white/45">({code})</span>
                              </span>
                            );
                          })()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Raw title</dt>
                        <dd className="text-white/85">{selected.title}</dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Raw slug</dt>
                        <dd className="font-mono text-[11px] text-white/75">{selected.slug}</dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Normalized title</dt>
                        <dd className="text-white/85">{selected.normalizedTitle}</dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Normalized slug</dt>
                        <dd className="font-mono text-[11px] text-emerald-200/85">{selected.normalizedSlug}</dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Scorer</dt>
                        <dd>{selected.scorerRecommendation}</dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Pipeline recommendation</dt>
                        <dd>{selected.recommendation}</dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Manual override</dt>
                        <dd>{selected.manualOverrideRecommendation ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Effective</dt>
                        <dd className="font-semibold">{getEffectiveRecommendation(selected)}</dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Normalization action</dt>
                        <dd>{selected.normalizationAction}</dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Warnings</dt>
                        <dd className="text-white/70">{(selected.normalizationWarnings ?? []).join(", ") || "—"}</dd>
                      </div>
                      {typeof selected.qualityScore === "number" ? (
                        <div>
                          <dt className="text-white/45">Quality score</dt>
                          <dd>{selected.qualityScore}</dd>
                        </div>
                      ) : null}
                      {Array.isArray(selected.qualityFlags) && selected.qualityFlags.length > 0 ? (
                        <div>
                          <dt className="text-white/45">Quality flags</dt>
                          <dd className="text-white/65">{(selected.qualityFlags as string[]).join(", ")}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="text-white/45">Rationale</dt>
                        <dd className="text-white/60">{recommendationExplanation(selected)}</dd>
                      </div>
                      {Object.entries(selected)
                        .filter(
                          (e): e is [string, string] =>
                            typeof e[1] === "string" &&
                            e[1].length > 0 &&
                            /rationale|explanation|reason/i.test(e[0]) &&
                            !["title", "normalizedTitle", "slug", "normalizedSlug"].includes(e[0]),
                        )
                        .map(([k, v]) => (
                          <div key={k}>
                            <dt className="text-white/45">{k}</dt>
                            <dd className="text-white/65">{v}</dd>
                          </div>
                        ))}
                    </dl>
                    <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                      <span className="w-full text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        Set disposition
                      </span>
                      {(["promote", "review", "reject"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDisposition(selected.id, d)}
                          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold capitalize hover:bg-white/10"
                        >
                          {d}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setDisposition(selected.id, "clear")}
                        className="rounded border border-white/15 px-2 py-1 text-[11px] text-white/55 hover:bg-white/5"
                      >
                        Clear override
                      </button>
                    </div>
                  </>
                )}
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
