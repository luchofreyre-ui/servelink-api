"use client";

import { useCallback, useState } from "react";

type Props = {
  diagnosticReport: string;
  /** Enriched AI / operator payload (preferred). */
  supportPayload: string;
  /** Optional compact legacy JSON without intelligence layer. */
  legacySupportPayload?: string;
  runMeta: {
    id: string;
    source: string;
    branch?: string | null;
    commitSha?: string | null;
    status: string;
    createdAt: string;
  };
};

export function SystemTestsDiagnosticCard(props: Props) {
  const [copied, setCopied] = useState<"diag" | "support" | "legacy" | null>(null);

  const copy = useCallback(async (kind: "diag" | "support" | "legacy", text: string) => {
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
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/80">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>
            <span className="text-white/55">Run ID:</span>{" "}
            <span className="font-mono text-white">{props.runMeta.id}</span>
          </span>
          <span>
            <span className="text-white/55">Source:</span> {props.runMeta.source}
          </span>
          <span>
            <span className="text-white/55">Branch:</span> {props.runMeta.branch ?? "—"}
          </span>
          <span>
            <span className="text-white/55">Commit:</span>{" "}
            <span className="font-mono">{props.runMeta.commitSha ?? "—"}</span>
          </span>
          <span>
            <span className="text-white/55">Status:</span> {props.runMeta.status}
          </span>
          <span>
            <span className="text-white/55">Created at:</span> {props.runMeta.createdAt}
          </span>
        </div>
      </div>
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
            {copied === "support" ? "Copied" : "Copy AI diagnostic payload for this run"}
          </button>
          {props.legacySupportPayload ? (
            <button
              type="button"
              onClick={() => void copy("legacy", props.legacySupportPayload!)}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              {copied === "legacy" ? "Copied" : "Copy raw payload"}
            </button>
          ) : null}
        </div>
      </div>
      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs leading-relaxed text-emerald-100/90">
        {props.diagnosticReport}
      </pre>
    </section>
  );
}
