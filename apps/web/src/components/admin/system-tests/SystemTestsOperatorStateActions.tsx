"use client";

import { useState } from "react";
import clsx from "clsx";
import { getStoredAccessToken } from "@/lib/auth";
import { updateAdminSystemTestFamilyOperatorState } from "@/lib/api/systemTestFamilyOperatorState";
import type { SystemTestFamilyOperatorState } from "@/types/systemTestResolution";

export type SystemTestsOperatorStateActionsProps = {
  familyId: string;
  currentState: "open" | "acknowledged" | "dismissed";
  onUpdated?: (next: SystemTestFamilyOperatorState) => void;
  compact?: boolean;
};

type Phase = "idle" | "saving";

export function SystemTestsOperatorStateActions(props: SystemTestsOperatorStateActionsProps) {
  const { familyId, currentState, onUpdated, compact } = props;
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function runUpdate(input: { state: "open" | "acknowledged" | "dismissed" }) {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Update failed");
      return;
    }
    setError(null);
    setPhase("saving");
    try {
      const next = await updateAdminSystemTestFamilyOperatorState(token, familyId, input);
      onUpdated?.(next);
    } catch {
      setError("Update failed");
    } finally {
      setPhase("idle");
    }
  }

  const btn =
    "text-left font-medium text-sky-300/90 hover:text-sky-200 disabled:opacity-45";
  const size = compact ? "text-[10px]" : "text-[11px]";

  const actions: { label: string; state: "open" | "acknowledged" | "dismissed" }[] =
    currentState === "open" ?
      [
        { label: "Acknowledge", state: "acknowledged" },
        { label: "Dismiss", state: "dismissed" },
      ]
    : currentState === "acknowledged" ?
      [
        { label: "Restore", state: "open" },
        { label: "Dismiss", state: "dismissed" },
      ]
    : [
        { label: "Restore", state: "open" },
        { label: "Acknowledge", state: "acknowledged" },
      ];

  return (
    <div
      className={clsx("flex flex-col gap-0.5", compact ? "items-start" : "")}
      data-testid="system-tests-operator-state-actions"
    >
      <div className={clsx("flex flex-wrap gap-x-2 gap-y-0.5", compact ? "" : "gap-x-3")}>
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            disabled={phase === "saving"}
            className={clsx(btn, size)}
            onClick={() => void runUpdate({ state: a.state })}
          >
            {a.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-[10px] text-rose-300/90">{error}</p> : null}
    </div>
  );
}
