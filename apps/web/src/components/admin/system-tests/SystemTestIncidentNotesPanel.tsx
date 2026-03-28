"use client";

import { useMemo, useState } from "react";
import type { SystemTestIncidentNote } from "@/types/systemTestIncidentActions";

type Props = {
  notes: SystemTestIncidentNote[];
  incidentKey: string;
  disabled?: boolean;
  onAddNote: (params: { incidentKey: string; text: string }) => Promise<void>;
};

export function SystemTestIncidentNotesPanel({
  notes,
  incidentKey,
  disabled,
  onAddNote,
}: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [notes],
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white">Notes</h3>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto">
        {orderedNotes.length === 0 ?
          <li className="text-sm text-white/45">No notes yet.</li>
        : orderedNotes.map((n) => (
            <li key={n.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <div className="text-xs text-white/45">
                {n.userName || n.userId || "Unknown"} · {new Date(n.createdAt).toLocaleString()}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{n.text}</p>
            </li>
          ))}
      </ul>
      <div className="mt-4 border-t border-white/10 pt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          disabled={disabled || saving}
          placeholder="Add an operator note…"
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-teal-400/50 focus:outline-none"
        />
        <button
          type="button"
          disabled={disabled || saving || !text.trim()}
          onClick={async () => {
            const t = text.trim();
            if (!t) return;
            setError(null);
            setSaving(true);
            try {
              await onAddNote({ incidentKey, text: t });
              setText("");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to add note");
            } finally {
              setSaving(false);
            }
          }}
          className="mt-2 rounded-lg border border-teal-400/40 bg-teal-500/20 px-4 py-2 text-xs font-medium text-teal-100 hover:bg-teal-500/30 disabled:opacity-40"
        >
          {saving ? "Adding…" : "Add note"}
        </button>
      </div>
    </div>
  );
}
