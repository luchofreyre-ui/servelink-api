"use client";

import { useState } from "react";
import type { SystemTestCaseResult } from "@/types/systemTests";
import { formatDurationMs } from "./systemTestsFormatting";

function isFailed(status: string): boolean {
  const s = status.toLowerCase();
  return s === "failed" || s === "timedout" || s === "interrupted";
}

function isFlakyNonFailing(c: SystemTestCaseResult): boolean {
  if (isFailed(c.status)) return false;
  const s = c.status.toLowerCase();
  if (s === "flaky") return true;
  return c.retryCount > 0 && s === "passed";
}

type Props = {
  cases: SystemTestCaseResult[];
};

function CaseBlock(props: { c: SystemTestCaseResult }) {
  const { c } = props;
  const [open, setOpen] = useState(false);
  const hasStack = Boolean(c.errorStack?.trim());

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{c.title}</p>
          <p className="mt-1 text-xs text-white/50">{c.fullName}</p>
          <p className="mt-2 flex flex-wrap gap-2 text-xs text-white/60">
            <span>status: {c.status}</span>
            <span>retries: {c.retryCount}</span>
            <span>{formatDurationMs(c.durationMs)}</span>
            {c.route ? <span>route: {c.route}</span> : null}
            {c.selector ? <span>selector: {c.selector}</span> : null}
            {c.line != null ? (
              <span>
                line: {c.line}
                {c.column != null ? `:${c.column}` : ""}
              </span>
            ) : null}
          </p>
          {c.errorMessage ? (
            <p className="mt-2 text-sm text-red-200/90">{c.errorMessage}</p>
          ) : null}
        </div>
      </div>
      {hasStack ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-xs font-medium text-sky-300 hover:text-sky-200"
          >
            {open ? "Hide stack trace" : "Show stack trace"}
          </button>
          {open ? (
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-white/80">
              {c.errorStack}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SystemTestsFailureList(props: Props) {
  const failing = props.cases.filter((c) => isFailed(c.status));
  const flakyOk = props.cases.filter((c) => isFlakyNonFailing(c));
  const rest = props.cases.filter((c) => !isFailed(c.status) && !isFlakyNonFailing(c));

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Failures</h2>
        {failing.length ? (
          <div className="space-y-3">
            {failing.map((c) => (
              <CaseBlock key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/50">No failing cases.</p>
        )}
      </section>

      {flakyOk.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-amber-100/90">Flaky / retried (non-failing)</h2>
          <div className="space-y-3">
            {flakyOk.map((c) => (
              <CaseBlock key={c.id} c={c} />
            ))}
          </div>
        </section>
      ) : null}

      {rest.length ? (
        <details className="group rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <summary className="cursor-pointer text-sm font-medium text-white/80">
            Passed / skipped ({rest.length})
          </summary>
          <div className="mt-4 space-y-3">
            {rest.map((c) => (
              <CaseBlock key={c.id} c={c} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
