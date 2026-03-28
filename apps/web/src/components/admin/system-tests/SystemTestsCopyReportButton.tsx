"use client";

import { useCallback, useState } from "react";

type Props = {
  /** Plain-text report to copy, or async generator. */
  getReportText: () => Promise<string>;
  label?: string;
  className?: string;
};

export function SystemTestsCopyReportButton(props: Props) {
  const { getReportText, label = "Copy report", className = "" } = props;
  const [phase, setPhase] = useState<"idle" | "busy" | "copied" | "error">("idle");
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    setPhase("busy");
    setFallbackText(null);
    try {
      const text = await getReportText();
      try {
        await navigator.clipboard.writeText(text);
        setPhase("copied");
        window.setTimeout(() => setPhase("idle"), 2000);
      } catch {
        setFallbackText(text);
        setPhase("error");
      }
    } catch (e) {
      setFallbackText(e instanceof Error ? e.message : "Failed to build report.");
      setPhase("error");
    }
  }, [getReportText]);

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={phase === "busy"}
        className="inline-flex items-center justify-center rounded-xl border border-violet-400/35 bg-violet-500/15 px-3 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/25 disabled:opacity-50"
      >
        {phase === "busy" ? "Copying…" : phase === "copied" ? "Copied report" : label}
      </button>
      {phase === "copied" ? <p className="text-xs text-emerald-300/90">Report copied to clipboard.</p> : null}
      {phase === "error" && fallbackText ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
          <p className="text-xs font-medium text-amber-100">Clipboard unavailable — copy manually:</p>
          <textarea
            readOnly
            className="mt-2 h-48 w-full resize-y rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-xs text-white/90"
            value={fallbackText}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      ) : null}
    </div>
  );
}
