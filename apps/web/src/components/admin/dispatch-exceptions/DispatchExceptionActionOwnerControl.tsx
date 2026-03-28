"use client";

import { useEffect, useState } from "react";

type Props = {
  dispatchExceptionKey: string;
  ownerUserId: string | null;
  disabled?: boolean;
  onUpdated: () => Promise<void> | void;
  updateOwner: (params: {
    dispatchExceptionKey: string;
    ownerUserId: string | null;
  }) => Promise<void>;
};

export function DispatchExceptionActionOwnerControl({
  dispatchExceptionKey,
  ownerUserId,
  disabled,
  onUpdated,
  updateOwner,
}: Props) {
  const [input, setInput] = useState(ownerUserId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(ownerUserId ?? "");
  }, [ownerUserId]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white">Owner</h3>
      <p className="mt-1 text-xs text-white/50">
        Paste a user id to assign. Current:{" "}
        {ownerUserId ?
          <span className="font-mono text-white/70">{ownerUserId}</span>
        : "Unassigned"}
      </p>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="User id"
          disabled={disabled || saving}
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-xs text-white placeholder:text-white/35 focus:border-teal-400/50 focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled || saving || !input.trim()}
            onClick={async () => {
              setError(null);
              setSaving(true);
              try {
                await updateOwner({
                  dispatchExceptionKey,
                  ownerUserId: input.trim(),
                });
                await onUpdated();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Assign failed");
              } finally {
                setSaving(false);
              }
            }}
            className="rounded-lg border border-teal-400/40 bg-teal-500/20 px-3 py-2 text-xs font-medium text-teal-100 hover:bg-teal-500/30 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Assign"}
          </button>
          <button
            type="button"
            disabled={disabled || saving || !ownerUserId}
            onClick={async () => {
              setError(null);
              setSaving(true);
              try {
                await updateOwner({ dispatchExceptionKey, ownerUserId: null });
                setInput("");
                await onUpdated();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Unassign failed");
              } finally {
                setSaving(false);
              }
            }}
            className="rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 disabled:opacity-40"
          >
            Unassign
          </button>
        </div>
      </div>
    </div>
  );
}
