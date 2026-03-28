"use client";

import { useState, type ReactNode } from "react";
import type {
  SystemTestArtifactRef,
  SystemTestFailureEvidenceSummary,
  SystemTestRichEvidence,
} from "@/types/systemTests";
import { SystemTestsArtifactLinks } from "./SystemTestsArtifactLinks";

type Props = {
  summary: SystemTestFailureEvidenceSummary;
  /** Extra lines from raw error message (not full stack). */
  diagnosticPreview?: string | null;
  richEvidence?: SystemTestRichEvidence | null;
  artifactRefs?: SystemTestArtifactRef[];
  debuggingHint?: string | null;
  className?: string;
};

function chip(text: string) {
  return (
    <span className="inline-flex max-w-full truncate rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/75">
      {text}
    </span>
  );
}

export function SystemTestsFailureEvidenceBlock(props: Props) {
  const {
    summary,
    diagnosticPreview,
    richEvidence,
    artifactRefs,
    debuggingHint,
    className = "",
  } = props;
  const [expanded, setExpanded] = useState(false);

  const rows: { label: string; value: string }[] = [];
  if (summary.assertionLine) rows.push({ label: "Assertion / error", value: summary.assertionLine });
  if (summary.locationLine) rows.push({ label: "Location", value: summary.locationLine });
  for (const d of summary.diagnosticLines) {
    rows.push({ label: "Diagnostic", value: d });
  }

  const hasRichCompact =
    Boolean(debuggingHint?.trim()) ||
    Boolean(richEvidence?.assertionType) ||
    Boolean(richEvidence?.locator || richEvidence?.selector) ||
    Boolean(richEvidence?.routeUrl) ||
    Boolean(richEvidence?.actionName || richEvidence?.stepName) ||
    (richEvidence?.testStepPath?.length ?? 0) > 0 ||
    (artifactRefs?.length ?? 0) > 0;

  const hasRichExpanded =
    hasRichCompact ||
    Boolean(richEvidence?.expectedText || richEvidence?.receivedText) ||
    Boolean(richEvidence?.timeoutMs != null) ||
    Boolean(richEvidence?.errorCode) ||
    (artifactRefs?.length ?? 0) > 0;

  const hasExpandableBody =
    Boolean(richEvidence?.expectedText || richEvidence?.receivedText) ||
    richEvidence?.timeoutMs != null ||
    Boolean(richEvidence?.errorCode) ||
    (richEvidence?.testStepPath != null && richEvidence.testStepPath.length > 3) ||
    (artifactRefs?.length ?? 0) > 0;

  if (!rows.length && !diagnosticPreview && !hasRichExpanded) {
    return null;
  }

  const chips: { key: string; node: ReactNode }[] = [];
  if (richEvidence?.routeUrl) chips.push({ key: "route", node: chip(`route: ${richEvidence.routeUrl}`) });
  if (richEvidence?.actionName) chips.push({ key: "action", node: chip(`action: ${richEvidence.actionName}`) });
  if (richEvidence?.stepName) chips.push({ key: "step", node: chip(`step: ${richEvidence.stepName}`) });
  for (let i = 0; i < Math.min(3, richEvidence?.testStepPath?.length ?? 0); i += 1) {
    const s = richEvidence!.testStepPath[i]!;
    chips.push({ key: `path-${i}`, node: chip(s.length > 48 ? `${s.slice(0, 45)}…` : s) });
  }

  return (
    <div className={`mt-3 space-y-2 rounded-lg border border-white/10 bg-black/25 p-3 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Evidence</p>
      {debuggingHint?.trim() ? (
        <p className="text-xs leading-snug text-amber-100/85">{debuggingHint.trim()}</p>
      ) : null}
      {hasRichCompact ? (
        <div className="space-y-1 text-xs text-white/75">
          {richEvidence?.assertionType ?
            <p>
              <span className="text-white/45">Assertion: </span>
              <span className="font-mono text-white/90">{richEvidence.assertionType}</span>
            </p>
          : null}
          {richEvidence?.locator || richEvidence?.selector ?
            <p>
              <span className="text-white/45">Locator: </span>
              <span className="break-all font-mono text-white/85">
                {richEvidence.locator ?? richEvidence.selector}
              </span>
            </p>
          : null}
          {chips.length ?
            <div className="flex flex-wrap gap-1.5 pt-0.5">{chips.map((c) => <span key={c.key}>{c.node}</span>)}</div>
          : null}
          {artifactRefs?.length ?
            <SystemTestsArtifactLinks refs={artifactRefs} expanded={false} compactLimit={4} />
          : null}
        </div>
      ) : null}

      {rows.length ? (
        <ul className="space-y-1.5 text-xs text-white/75">
          {rows.map((r, i) => (
            <li key={`${i}-${r.label}`}>
              <span className="text-white/45">{r.label}: </span>
              <span className="font-mono text-white/85">{r.value}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {hasExpandableBody ?
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[10px] font-semibold uppercase tracking-wide text-sky-300/90 hover:text-sky-200"
        >
          {expanded ? "Hide structured context" : "Show structured context"}
        </button>
      : null}

      {expanded && hasExpandableBody ?
        <div className="space-y-2 border-t border-white/10 pt-2 text-xs text-white/70">
          {richEvidence?.expectedText || richEvidence?.receivedText ?
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Expected vs received</p>
              <p className="mt-1 font-mono text-white/80">
                {richEvidence.expectedText ?
                  <span className="block break-all">Expected: {richEvidence.expectedText}</span>
                : null}
                {richEvidence.receivedText ?
                  <span className="mt-1 block break-all">Received: {richEvidence.receivedText}</span>
                : null}
              </p>
            </div>
          : null}
          {richEvidence?.timeoutMs != null ?
            <p>
              <span className="text-white/45">Timeout: </span>
              <span className="font-mono">{richEvidence.timeoutMs} ms</span>
            </p>
          : null}
          {richEvidence?.errorCode ?
            <p>
              <span className="text-white/45">Error code: </span>
              <span className="font-mono">{richEvidence.errorCode}</span>
            </p>
          : null}
          {richEvidence?.testStepPath && richEvidence.testStepPath.length > 3 ?
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Step path</p>
              <ol className="mt-1 list-inside list-decimal font-mono text-[11px] text-white/65">
                {richEvidence.testStepPath.map((s, i) => (
                  <li key={`${i}-${s.slice(0, 24)}`} className="break-all">
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          : null}
          {artifactRefs?.length ?
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Artifacts</p>
              <SystemTestsArtifactLinks refs={artifactRefs} expanded className="!mt-1" />
            </div>
          : null}
        </div>
      : null}

      {diagnosticPreview ?
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Message preview</p>
          <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-snug text-white/65">
            {diagnosticPreview}
          </pre>
        </div>
      : null}
    </div>
  );
}
