"use client";

import { useEffect, useState } from "react";
import type { DispatchExceptionActionStatus } from "@/types/dispatchExceptionActions";

const STATUSES: DispatchExceptionActionStatus[] = [
  "open",
  "investigating",
  "waiting",
  "resolved",
  "dismissed",
];

type Props = {
  dispatchExceptionKey: string;
  status: DispatchExceptionActionStatus;
  disabled?: boolean;
  onUpdated: () => Promise<void> | void;
  updateStatus: (params: {
    dispatchExceptionKey: string;
    status: DispatchExceptionActionStatus;
  }) => Promise<void>;
};

export function DispatchExceptionActionStatusControl({
  dispatchExceptionKey,
  status,
  disabled,
  onUpdated,
  updateStatus,
}: Props) {
  const [value, setValue] = useState<DispatchExceptionActionStatus>(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(status);
  }, [status]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white">Lifecycle status</h3>
      <p className="mt-1 text-xs text-white/45">
        Backend enforces allowed transitions; invalid moves will error below.
      </p>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={value}
          disabled={disabled || saving}
          onChange={(e) =>
            setValue(e.target.value as DispatchExceptionActionStatus)
          }
          className="min-w-[10rem] rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-teal-400/50 focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled || saving || value === status}
          onClick={async () => {
            setError(null);
            setSaving(true);
            try {
              await updateStatus({ dispatchExceptionKey, status: value });
              await onUpdated();
            } catch (e) {
              setError(
                e instanceof Error ?
                  e.message
                : "Invalid transition or server error",
              );
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
