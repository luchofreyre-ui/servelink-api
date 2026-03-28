"use client";

import { useEffect, useState } from "react";
import type { DispatchExceptionActionPriority } from "@/types/dispatchExceptionActions";

const PRIORITIES: DispatchExceptionActionPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
];

type Props = {
  dispatchExceptionKey: string;
  priority: DispatchExceptionActionPriority;
  disabled?: boolean;
  onUpdated: () => Promise<void> | void;
  updatePriority: (params: {
    dispatchExceptionKey: string;
    priority: DispatchExceptionActionPriority;
  }) => Promise<void>;
};

export function DispatchExceptionActionPriorityControl({
  dispatchExceptionKey,
  priority,
  disabled,
  onUpdated,
  updatePriority,
}: Props) {
  const [value, setValue] = useState<DispatchExceptionActionPriority>(priority);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(priority);
  }, [priority]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white">Priority</h3>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={value}
          disabled={disabled || saving}
          onChange={(e) =>
            setValue(e.target.value as DispatchExceptionActionPriority)
          }
          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-teal-400/50 focus:outline-none"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled || saving || value === priority}
          onClick={async () => {
            setError(null);
            setSaving(true);
            try {
              await updatePriority({ dispatchExceptionKey, priority: value });
              await onUpdated();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Update failed");
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-lg border border-teal-400/40 bg-teal-500/20 px-3 py-2 text-xs font-medium text-teal-100 hover:bg-teal-500/30 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Apply"}
        </button>
      </div>
    </div>
  );
}
