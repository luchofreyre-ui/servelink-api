"use client";

import type { SystemTestFailureEvidenceSummary, SystemTestFailureGroupComparison } from "@/types/systemTests";

const emptyEvidence: SystemTestFailureEvidenceSummary = {
  messageLine: null,
  assertionLine: null,
  locationLine: null,
  diagnosticLines: [],
};
import { SystemTestsFailureEvidenceBlock } from "./SystemTestsFailureEvidenceBlock";
import { SystemTestsFailureFamilyInline } from "./SystemTestsFailureFamilyInline";

type Variant = "new" | "resolved" | "persistent";

type Props = {
  variant: Variant;
  groups: SystemTestFailureGroupComparison[];
};

function titleForVariant(v: Variant): string {
  switch (v) {
    case "new":
      return "New failures";
    case "resolved":
      return "Resolved failures";
    default:
      return "Persistent failures";
  }
}

function emptyCopy(v: Variant): string {
  switch (v) {
    case "new":
      return "No new failure groups in target vs base.";
    case "resolved":
      return "No failure groups cleared since base.";
    default:
      return "No shared failure fingerprints between runs.";
  }
}

export function SystemTestsComparisonGroupsPanel(props: Props) {
  const { variant, groups } = props;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{titleForVariant(variant)}</h2>
      {!groups.length ? (
        <p className="text-sm text-white/55">{emptyCopy(variant)}</p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div
              key={`${variant}-${g.key}`}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold text-white">{g.title}</p>
                  <p className="break-all font-mono text-xs text-white/45">{g.key}</p>
                  <p className="text-xs text-white/50">
                    File: <span className="text-white/75">{g.file}</span>
                    {" · "}
                    Project: <span className="text-white/75">{g.projectName ?? "unknown"}</span>
                  </p>
                  {variant === "new" ? (
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${
                        g.novelty === "expanded"
                          ? "bg-amber-500/20 text-amber-100 ring-amber-500/35"
                          : "bg-red-500/20 text-red-100 ring-red-500/35"
                      }`}
                    >
                      {g.novelty === "expanded" ? "expanded" : "new"}
                    </span>
                  ) : null}
                  {variant === "resolved" ? (
                    <span className="inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-100 ring-1 ring-emerald-500/35">
                      resolved
                    </span>
                  ) : null}
                  {variant === "persistent" ? (
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${
                        g.changeVersusBase === "worse"
                          ? "bg-red-500/20 text-red-100 ring-red-500/35"
                          : g.changeVersusBase === "better"
                            ? "bg-emerald-500/20 text-emerald-100 ring-emerald-500/35"
                            : "bg-white/10 text-white/70 ring-white/20"
                      }`}
                    >
                      {g.changeVersusBase === "worse"
                        ? "worse"
                        : g.changeVersusBase === "better"
                          ? "better"
                          : "same"}
                    </span>
                  ) : null}
                </div>
                <div className="text-right text-xs text-white/55">
                  {variant === "new" ? (
                    <p>
                      Target occurrences: <span className="font-medium text-white">{g.targetOccurrences}</span>
                    </p>
                  ) : null}
                  {variant === "resolved" ? (
                    <p>
                      Base occurrences: <span className="font-medium text-white">{g.baseOccurrences}</span>
                    </p>
                  ) : null}
                  {variant === "persistent" ? (
                    <div className="space-y-0.5">
                      <p>
                        Base: <span className="text-white">{g.baseOccurrences}</span> → Target:{" "}
                        <span className="text-white">{g.targetOccurrences}</span>
                      </p>
                      <p>
                        Delta:{" "}
                        <span className="text-white">
                          {g.deltaOccurrences > 0 ? "+" : ""}
                          {g.deltaOccurrences}
                        </span>
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-sm text-red-200/85">{g.shortMessage || "—"}</p>
              {g.family ?
                <div className="mt-2">
                  <SystemTestsFailureFamilyInline family={g.family} />
                </div>
              : null}
              <SystemTestsFailureEvidenceBlock
                summary={g.evidenceSummary ?? emptyEvidence}
                richEvidence={g.richEvidence}
                artifactRefs={g.artifactRefs}
                debuggingHint={g.debuggingHint}
              />
              {variant === "persistent" &&
              g.baseShortMessage != null &&
              g.targetShortMessage != null &&
              g.baseShortMessage !== g.targetShortMessage ? (
                <p className="mt-1 text-xs text-white/45">
                  Message shifted vs base (see combined line above).
                </p>
              ) : null}
              {g.testTitles.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Tests</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-white/75">
                    {g.testTitles.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
