"use client";

import type { SystemTestIncidentFixTrackApi } from "@/lib/api/systemTestIncidents";

type Props = {
  fixTrack: SystemTestIncidentFixTrackApi;
};

export function SystemTestsIncidentFixTrackCard(props: Props) {
  const { fixTrack } = props;
  return (
    <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-4 text-sm text-cyan-50">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-cyan-200/70">Fix track</h3>
      <p className="mt-2 text-xs text-cyan-100/80">
        Primary area: <span className="font-mono text-white">{fixTrack.primaryArea}</span>
        {fixTrack.suggestedOwnerHint ?
          <>
            {" "}
            · Owner hint: <span className="text-white/90">{fixTrack.suggestedOwnerHint}</span>
          </>
        : null}
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase text-cyan-200/60">Recommended steps</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-white/85">
            {fixTrack.recommendedSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-cyan-200/60">Validation</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-white/85">
            {fixTrack.validationSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      </div>
      {fixTrack.representativeFiles.length ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase text-cyan-200/60">Representative files</p>
          <ul className="mt-1 space-y-0.5 font-mono text-[10px] text-white/70">
            {fixTrack.representativeFiles.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {fixTrack.representativeFamilyKeys.length ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase text-cyan-200/60">Family keys</p>
          <ul className="mt-1 space-y-0.5 font-mono text-[10px] text-white/70">
            {fixTrack.representativeFamilyKeys.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
