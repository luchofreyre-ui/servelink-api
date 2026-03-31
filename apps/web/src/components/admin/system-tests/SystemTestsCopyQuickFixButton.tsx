"use client";

import { useState } from "react";
import clsx from "clsx";

export type SystemTestsCopyQuickFixButtonProps = {
  text: string;
  className?: string;
};

type CopyPhase = "idle" | "busy" | "copied" | "failed";

const RESET_COPIED_MS = 1800;
const RESET_FAILED_MS = 2200;

export function SystemTestsCopyQuickFixButton(props: SystemTestsCopyQuickFixButtonProps) {
  const { text, className } = props;
  const [phase, setPhase] = useState<CopyPhase>("idle");

  async function handleCopy() {
    if (phase === "busy") return;
    setPhase("busy");
    try {
      await navigator.clipboard.writeText(text);
      setPhase("copied");
      window.setTimeout(() => setPhase("idle"), RESET_COPIED_MS);
    } catch {
      setPhase("failed");
      window.setTimeout(() => setPhase("idle"), RESET_FAILED_MS);
    }
  }

  const label =
    phase === "copied" ? "Copied"
    : phase === "failed" ? "Copy failed"
    : "Copy quick fix";

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={phase === "busy"}
      className={clsx(
        "text-left text-[11px] font-medium text-sky-300/90 hover:text-sky-200 disabled:opacity-50",
        className,
      )}
      data-testid="system-tests-copy-quick-fix-button"
    >
      {label}
    </button>
  );
}
