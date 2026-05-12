"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchOperationalPresenceSnapshot,
  postOperationalPresenceHeartbeat,
} from "@/lib/api/operationalCommandPresence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";
import { REALTIME_OPERATIONAL_COMMAND_GOVERNANCE_V1 } from "@/lib/operational/realtimeOperationalCommandGovernanceV1";
import {
  getOperationalPresenceDraft,
  subscribeOperationalPresenceDraft,
  type OperationalPresenceDraft,
} from "@/lib/operational/operationalRealtimePresenceBridge";

function resolveHeartbeatBody(
  variant: "command_center" | "war_room",
  draft: OperationalPresenceDraft,
): {
  surface: string;
  warRoomActive: boolean;
  workspaceId: string | null;
  replayReviewSessionId: string | null;
  graphSelectedNodeId: string | null;
  replayChronologyFrameId: string | null;
  payloadJson: Record<string, unknown>;
} {
  const workspaceId = draft.workspaceId ?? null;
  const replayReviewSessionId = draft.replayReviewSessionId ?? null;
  const graphSelectedNodeId = draft.graphSelectedNodeId ?? null;
  const replayChronologyFrameId = draft.replayChronologyFrameId ?? null;
  const payloadJson: Record<string, unknown> = {
    graphInteractionSurface: draft.graphInteractionSurface ?? null,
  };

  if (variant === "war_room") {
    return {
      surface: "war_room",
      warRoomActive: true,
      workspaceId,
      replayReviewSessionId,
      graphSelectedNodeId,
      replayChronologyFrameId,
      payloadJson,
    };
  }

  let surface = "command_center";
  if (draft.graphInteractionSurface && draft.graphSelectedNodeId) {
    surface = draft.graphInteractionSurface;
  } else if (replayReviewSessionId) {
    surface = "replay_review";
  } else if (workspaceId) {
    surface = "workspace";
  }

  return {
    surface,
    warRoomActive: false,
    workspaceId,
    replayReviewSessionId,
    graphSelectedNodeId,
    replayChronologyFrameId,
    payloadJson,
  };
}

function truncateEmail(email: string, max = 28) {
  if (email.length <= max) return email;
  return `${email.slice(0, max - 1)}…`;
}

export function AdminOperationalPresenceRibbon(props: {
  enabled: boolean;
  commandSurfaceVariant: "command_center" | "war_room";
}) {
  const [operators, setOperators] = useState<
    Awaited<
      ReturnType<typeof fetchOperationalPresenceSnapshot>
    >["operators"]
  >([]);
  const [snapErr, setSnapErr] = useState<string | null>(null);
  const [, bumpDraft] = useState(0);

  useEffect(() => {
    return subscribeOperationalPresenceDraft(() => bumpDraft((n) => n + 1));
  }, []);

  useEffect(() => {
    if (!props.enabled) {
      setOperators([]);
      return;
    }

    let cancelled = false;

    async function snap() {
      try {
        const r = await fetchOperationalPresenceSnapshot(null);
        if (!cancelled) {
          setOperators(r.operators);
          setSnapErr(null);
        }
      } catch {
        if (!cancelled) {
          setOperators([]);
          setSnapErr(COMMAND_CENTER_UX.realtimePresenceRibbonUnknownError);
        }
      }
    }

    void snap();
    const poll = window.setInterval(() => void snap(), 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [props.enabled]);

  useEffect(() => {
    if (!props.enabled) return;

    let cancelled = false;

    async function beat() {
      const draft = getOperationalPresenceDraft();
      const body = resolveHeartbeatBody(props.commandSurfaceVariant, draft);
      try {
        await postOperationalPresenceHeartbeat(body);
      } catch {
        /* coordination visibility only — avoid noisy alerts */
      }
    }

    void beat();
    const id = window.setInterval(() => {
      if (!cancelled) void beat();
    }, 25_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [props.enabled, props.commandSurfaceVariant]);

  const summary = useMemo(() => {
    return operators.slice(0, 10).map((o) => ({
      key: o.userId,
      label: truncateEmail(o.email || o.userId),
      surface: o.surface,
      graph:
        o.graphSelectedNodeId ?
          o.graphSelectedNodeId.slice(0, 12)
        : null,
      replay: o.replayReviewSessionId?.slice(0, 8) ?? null,
      workspace: o.workspaceId?.slice(0, 8) ?? null,
      war: o.warRoomActive,
    }));
  }, [operators]);

  if (!props.enabled) return null;

  return (
    <section
      id="operational-realtime-presence-ribbon"
      aria-label={COMMAND_CENTER_UX.realtimePresenceRibbonTitle}
      className="rounded-2xl border border-cyan-400/20 bg-cyan-950/15 px-5 py-4 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200/90">
            {COMMAND_CENTER_UX.realtimePresenceRibbonTitle}
          </p>
          <p className="mt-1 max-w-4xl text-xs text-slate-400">
            {COMMAND_CENTER_UX.realtimePresenceRibbonSubtitle}
          </p>
          <p className="mt-2 text-[10px] text-slate-600">
            Governance:{" "}
            <span className="text-slate-500">
              {REALTIME_OPERATIONAL_COMMAND_GOVERNANCE_V1.title}
            </span>
            {" · "}
            <Link
              href="#operational-realtime-presence-ribbon"
              className="text-cyan-200/80 underline-offset-2 hover:underline"
            >
              Anchor
            </Link>
          </p>
        </div>
        {snapErr ?
          <p className="text-xs text-amber-200/90">{snapErr}</p>
        : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {summary.length === 0 ?
          <p className="text-xs text-slate-500">
            {COMMAND_CENTER_UX.realtimePresenceRibbonEmpty}
          </p>
        : summary.map((o) => (
            <div
              key={o.key}
              title={`${o.surface}${o.war ? " · war room" : ""}`}
              className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] text-slate-200"
            >
              <span className="font-medium text-slate-50">{o.label}</span>
              <span className="text-slate-500"> · </span>
              <span className="text-cyan-100/80">{o.surface}</span>
              {o.graph ?
                <>
                  <span className="text-slate-600"> · </span>
                  <span className="font-mono text-[10px] text-violet-200/80">
                    {o.graph}…
                  </span>
                </>
              : null}
              {o.replay ?
                <>
                  <span className="text-slate-600"> · replay </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {o.replay}…
                  </span>
                </>
              : null}
              {o.workspace ?
                <>
                  <span className="text-slate-600"> · ws </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {o.workspace}…
                  </span>
                </>
              : null}
            </div>
          ))
        }
      </div>

      <p className="mt-3 border-t border-white/10 pt-2 text-[10px] text-slate-600">
        {COMMAND_CENTER_UX.realtimePresenceRibbonGovernanceFootnote}
      </p>
    </section>
  );
}
