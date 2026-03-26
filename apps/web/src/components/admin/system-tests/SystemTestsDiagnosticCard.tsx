"use client";

import { useCallback, useState } from "react";

type Props = {
  diagnosticReport: string;
  supportPayload: string;
};

export function SystemTestsDiagnosticCard(props: Props) {
  const [copied, setCopied] = useState<"diag" | "support" | null>(null);

  const copy = useCallback(async (kind: "diag" | "support", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Diagnostic report</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copy("diag", props.diagnosticReport)}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
          >
            {copied === "diag" ? "Copied" : "Copy diagnostic report"}
          </button>
          <button
            type="button"
            onClick={() => void copy("support", props.supportPayload)}
            className="rounded-lg border border-sky-500/30 bg-sky-500/15 px-3 py-1.5 text-sm font-medium text-sky-100 hover:bg-sky-500/25"
          >
            {copied === "support" ? "Copied" : "Copy support payload"}
          </button>
        </div>
      </div>
      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs leading-relaxed text-emerald-100/90">
        {props.diagnosticReport}
      </pre>
    </section>
  );
}
