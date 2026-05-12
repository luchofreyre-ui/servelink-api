"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchGraphCollaborationAnnotations,
  postGraphCollaborationAnnotation,
  type OperationalGraphCollaborationAnnotationRow,
} from "@/lib/api/operationalCommandPresence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

export function AdminOperationalGraphCollaborationAnnotations(props: {
  graphNodeId: string | null;
}) {
  const [items, setItems] = useState<OperationalGraphCollaborationAnnotationRow[]>(
    [],
  );
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const id = props.graphNodeId?.trim() ?? "";
    if (!id) {
      setItems([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchGraphCollaborationAnnotations(id, 80);
      setItems(rows);
    } catch (e) {
      setItems([]);
      setError(
        e instanceof Error ?
          e.message
        : COMMAND_CENTER_UX.realtimePresenceRibbonUnknownError,
      );
    } finally {
      setLoading(false);
    }
  }, [props.graphNodeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onPost = useCallback(async () => {
    const id = props.graphNodeId?.trim() ?? "";
    const body = draft.trim();
    if (!id || !body) return;
    setPosting(true);
    setError(null);
    try {
      await postGraphCollaborationAnnotation({ graphNodeId: id, body });
      setDraft("");
      await reload();
    } catch (e) {
      setError(
        e instanceof Error ?
          e.message
        : COMMAND_CENTER_UX.realtimePresenceRibbonUnknownError,
      );
    } finally {
      setPosting(false);
    }
  }, [draft, props.graphNodeId, reload]);

  if (!props.graphNodeId?.trim()) {
    return (
      <section
        id="operational-graph-collaboration-annotations"
        aria-label={COMMAND_CENTER_UX.graphCollaborationAnnotationsTitle}
        className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-950/10 p-5 text-sm text-slate-400"
      >
        {COMMAND_CENTER_UX.graphCollaborationAnnotationsEmpty}
      </section>
    );
  }

  return (
    <section
      id="operational-graph-collaboration-annotations"
      aria-label={COMMAND_CENTER_UX.graphCollaborationAnnotationsTitle}
      className="rounded-2xl border border-fuchsia-400/18 bg-fuchsia-950/12 p-5 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
    >
      <div className="border-b border-white/10 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-200/90">
          {COMMAND_CENTER_UX.graphCollaborationAnnotationsTitle}
        </p>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          {COMMAND_CENTER_UX.graphCollaborationAnnotationsSubtitle}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {COMMAND_CENTER_UX.graphCollaborationAnnotationsGovernanceNote}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="font-mono text-[11px] text-slate-500">
          {props.graphNodeId}
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10 disabled:opacity-50"
        >
          {COMMAND_CENTER_UX.graphCollaborationAnnotationsReloadButton}
        </button>
      </div>

      {error ?
        <p className="mt-3 text-xs text-amber-200/90">{error}</p>
      : null}

      <label className="mt-4 block text-[11px] text-slate-500">
        <span className="sr-only">
          {COMMAND_CENTER_UX.graphCollaborationAnnotationsPlaceholder}
        </span>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder={
            COMMAND_CENTER_UX.graphCollaborationAnnotationsPlaceholder
          }
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
        />
      </label>
      <button
        type="button"
        onClick={() => void onPost()}
        disabled={posting || !draft.trim()}
        className="mt-2 rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/15 px-3 py-1.5 text-xs font-medium text-fuchsia-50 hover:bg-fuchsia-500/25 disabled:opacity-40"
      >
        {COMMAND_CENTER_UX.graphCollaborationAnnotationsPostButton}
      </button>

      <div className="mt-4 space-y-2">
        {loading && items.length === 0 ?
          <p className="text-xs text-slate-500">{COMMAND_CENTER_UX.coordinatedLoading}</p>
        : items.length === 0 ?
          <p className="text-xs text-slate-500">—</p>
        : items.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300"
            >
              <p className="font-mono text-[10px] text-slate-600">
                {row.createdAtIso} · {row.authorEmail}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-slate-200">
                {row.body}
              </p>
            </div>
          ))
        }
      </div>
    </section>
  );
}
