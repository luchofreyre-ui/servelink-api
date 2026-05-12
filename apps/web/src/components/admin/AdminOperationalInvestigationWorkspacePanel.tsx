"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createOperationalCommandWorkspace,
  deleteOperationalCommandWorkspace,
  fetchOperationalCommandWorkspaces,
  fetchWorkspaceCollaborationTimeline,
  patchOperationalCommandWorkspace,
  postPhaseFTeamContinuityMarker,
  shareOperationalCommandWorkspace,
  unshareOperationalCommandWorkspace,
  type ServerOperationalWorkspace,
  type WorkspaceTimelineEvent,
} from "@/lib/api/operationalCommandCollaboration";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";
import { setOperationalPresencePartial } from "@/lib/operational/operationalRealtimePresenceBridge";
import {
  buildWorkspaceExportEnvelope,
  deleteInvestigationWorkspace,
  loadInvestigationWorkspaces,
  mergeImportedWorkspaces,
  newInvestigationWorkspace,
  parseWorkspaceImportEnvelope,
  saveInvestigationWorkspaces,
  upsertInvestigationWorkspace,
  type InvestigationMarker,
  type OperationalInvestigationWorkspace,
} from "@/lib/operational/investigationWorkspaceStorage";

function nowIso(): string {
  return new Date().toISOString();
}

export function AdminOperationalInvestigationWorkspacePanel() {
  const [hydrated, setHydrated] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [serverLoading, setServerLoading] = useState(false);

  const [serverWorkspaces, setServerWorkspaces] = useState<
    ServerOperationalWorkspace[]
  >([]);
  const [localWorkspaces, setLocalWorkspaces] = useState<
    OperationalInvestigationWorkspace[]
  >([]);
  const [activeId, setActiveId] = useState<string>("");

  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timeline, setTimeline] = useState<WorkspaceTimelineEvent[]>([]);

  const [shareEmail, setShareEmail] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const refreshServer = useCallback(async () => {
    setServerLoading(true);
    try {
      const next = await fetchOperationalCommandWorkspaces();
      setServerOnline(true);
      setServerWorkspaces(next);
      setActiveId((cur) => {
        if (cur && next.some((w) => w.id === cur)) return cur;
        return next[0]?.id ?? "";
      });
    } catch {
      setServerOnline(false);
      setServerWorkspaces([]);
      const loc = loadInvestigationWorkspaces();
      setLocalWorkspaces(loc);
      setActiveId((cur) => {
        if (cur && loc.some((w) => w.id === cur)) return cur;
        return loc[0]?.id ?? "";
      });
    } finally {
      setServerLoading(false);
    }
  }, []);

  const refreshLocalOnly = useCallback(() => {
    const next = loadInvestigationWorkspaces();
    setLocalWorkspaces(next);
    setActiveId((cur) => {
      if (cur && next.some((w) => w.id === cur)) return cur;
      return next[0]?.id ?? "";
    });
  }, []);

  useEffect(() => {
    setHydrated(true);
    void refreshServer();
  }, [refreshServer]);

  const activeServer = useMemo(
    () => serverWorkspaces.find((w) => w.id === activeId) ?? null,
    [serverWorkspaces, activeId],
  );

  const activeLocal = useMemo(
    () => localWorkspaces.find((w) => w.id === activeId) ?? null,
    [localWorkspaces, activeId],
  );

  const useLegacyLocal = serverOnline === false;

  const [draft, setDraft] = useState({
    title: "",
    notes: "",
    handoffSummary: "",
    linkedReplaySessionId: "",
    linkedOlderReplaySessionId: "",
    linkedNewerReplaySessionId: "",
  });

  useEffect(() => {
    if (activeServer && !useLegacyLocal) {
      setDraft({
        title: activeServer.title,
        notes: activeServer.notes,
        handoffSummary: activeServer.handoffSummary,
        linkedReplaySessionId: activeServer.linkedReplaySessionId ?? "",
        linkedOlderReplaySessionId:
          activeServer.linkedOlderReplaySessionId ?? "",
        linkedNewerReplaySessionId:
          activeServer.linkedNewerReplaySessionId ?? "",
      });
      void (async () => {
        try {
          const rows = await fetchWorkspaceCollaborationTimeline(
            activeServer.id,
          );
          setTimeline(rows);
        } catch {
          setTimeline([]);
        }
      })();
      return;
    }

    if (activeLocal && useLegacyLocal) {
      setDraft({
        title: activeLocal.title,
        notes: activeLocal.notes,
        handoffSummary: activeLocal.handoffSummary,
        linkedReplaySessionId: "",
        linkedOlderReplaySessionId: "",
        linkedNewerReplaySessionId: "",
      });
      setTimeline([]);
    }
  }, [activeServer, activeLocal, useLegacyLocal]);

  useEffect(() => {
    const wid =
      !useLegacyLocal && activeServer?.id?.trim() ?
        activeServer.id.trim()
      : null;
    setOperationalPresencePartial({ workspaceId: wid });
  }, [useLegacyLocal, activeServer?.id]);

  const persistServer = useCallback(
    async (patch: Partial<ServerOperationalWorkspace>) => {
      if (!activeServer) return;
      const body = {
        title: patch.title ?? draft.title,
        notes: patch.notes ?? draft.notes,
        handoffSummary: patch.handoffSummary ?? draft.handoffSummary,
        bookmarks: patch.bookmarks ?? activeServer.bookmarks,
        markers: patch.markers ?? activeServer.markers,
        linkedReplaySessionId:
          patch.linkedReplaySessionId !== undefined ?
            patch.linkedReplaySessionId
          : draft.linkedReplaySessionId.trim() || null,
        linkedOlderReplaySessionId:
          patch.linkedOlderReplaySessionId !== undefined ?
            patch.linkedOlderReplaySessionId
          : draft.linkedOlderReplaySessionId.trim() || null,
        linkedNewerReplaySessionId:
          patch.linkedNewerReplaySessionId !== undefined ?
            patch.linkedNewerReplaySessionId
          : draft.linkedNewerReplaySessionId.trim() || null,
      };
      const ws = await patchOperationalCommandWorkspace(
        activeServer.id,
        body,
      );
      setServerWorkspaces((prev) =>
        prev.map((w) => (w.id === ws.id ? ws : w)),
      );
      try {
        const rows = await fetchWorkspaceCollaborationTimeline(ws.id);
        setTimeline(rows);
      } catch {
        /* timeline refresh optional */
      }
    },
    [activeServer, draft],
  );

  const recordTeamContinuity = useCallback(
    async (
      markerKind:
        | "handoff_snapshot"
        | "escalation_continuity"
        | "shift_transition"
        | "shared_bookmark_anchor",
    ) => {
      if (!activeServer) return;
      const summary = window.prompt(
        COMMAND_CENTER_UX.workspaceContinuitySubtitle,
      );
      if (!summary?.trim()) return;
      try {
        await postPhaseFTeamContinuityMarker(activeServer.id, {
          markerKind,
          summary: summary.trim(),
        });
        try {
          const rows = await fetchWorkspaceCollaborationTimeline(
            activeServer.id,
          );
          setTimeline(rows);
          setTimelineOpen(true);
        } catch {
          /* timeline refresh optional */
        }
      } catch (e) {
        window.alert(String(e instanceof Error ? e.message : e));
      }
    },
    [activeServer],
  );

  const persistLocal = useCallback(
    (patch: Partial<OperationalInvestigationWorkspace>) => {
      if (!activeLocal) return;
      const next: OperationalInvestigationWorkspace = {
        ...activeLocal,
        ...patch,
        updatedAtIso: nowIso(),
      };
      const merged = upsertInvestigationWorkspace(next);
      setLocalWorkspaces(merged);
    },
    [activeLocal],
  );

  const onNew = useCallback(async () => {
    if (useLegacyLocal) {
      const ws = newInvestigationWorkspace("Untitled investigation");
      const merged = upsertInvestigationWorkspace(ws);
      setLocalWorkspaces(merged);
      setActiveId(ws.id);
      return;
    }
    try {
      const ws = await createOperationalCommandWorkspace({
        title: "Untitled investigation",
      });
      setServerWorkspaces((prev) => [ws, ...prev]);
      setActiveId(ws.id);
    } catch (e) {
      window.alert(String(e instanceof Error ? e.message : e));
    }
  }, [useLegacyLocal]);

  const onDelete = useCallback(async () => {
    if (useLegacyLocal && activeLocal) {
      if (
        typeof window !== "undefined" &&
        !window.confirm(
          `Delete workspace “${activeLocal.title}”? This removes browser-local persistence only.`,
        )
      ) {
        return;
      }
      deleteInvestigationWorkspace(activeLocal.id);
      refreshLocalOnly();
      return;
    }
    if (!activeServer) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(COMMAND_CENTER_UX.workspaceDeleteConfirmServer)
    ) {
      return;
    }
    try {
      await deleteOperationalCommandWorkspace(activeServer.id);
      await refreshServer();
    } catch (e) {
      window.alert(String(e instanceof Error ? e.message : e));
    }
  }, [
    activeLocal,
    activeServer,
    refreshLocalOnly,
    refreshServer,
    useLegacyLocal,
  ]);

  const addBookmark = useCallback(() => {
    if (typeof window === "undefined") return;
    const hash =
      window.location.hash.replace(/^#/, "").trim() ||
      "operational-situation-landmark";
    const href = `${window.location.pathname}#${hash}`;
    const bm = {
      id: crypto.randomUUID(),
      href,
      label: hash.replace(/-/g, " "),
      createdAtIso: nowIso(),
    };
    if (useLegacyLocal && activeLocal) {
      persistLocal({ bookmarks: [...activeLocal.bookmarks, bm] });
    } else if (activeServer) {
      void persistServer({
        bookmarks: [...activeServer.bookmarks, bm],
      });
    }
  }, [
    activeLocal,
    activeServer,
    persistLocal,
    persistServer,
    useLegacyLocal,
  ]);

  const [markerKind, setMarkerKind] =
    useState<InvestigationMarker["kind"]>("incident");
  const [markerTarget, setMarkerTarget] = useState("");
  const [markerAssignee, setMarkerAssignee] = useState("");
  const [markerAssigneeUserId, setMarkerAssigneeUserId] = useState("");
  const [markerNote, setMarkerNote] = useState("");

  const addMarker = useCallback(() => {
    const note = markerNote.trim();
    if (!note) return;
    const m: InvestigationMarker = {
      id: crypto.randomUUID(),
      kind: markerKind,
      targetId: markerTarget.trim() || undefined,
      assigneeDisplayName: markerAssignee.trim() || undefined,
      assigneeUserId:
        !useLegacyLocal && markerAssigneeUserId.trim() ?
          markerAssigneeUserId.trim()
        : undefined,
      note,
      createdAtIso: nowIso(),
    };
    if (useLegacyLocal && activeLocal) {
      persistLocal({ markers: [...activeLocal.markers, m] });
    } else if (activeServer) {
      void persistServer({
        markers: [...activeServer.markers, m],
      });
    }
    setMarkerNote("");
    setMarkerTarget("");
    setMarkerAssignee("");
    setMarkerAssigneeUserId("");
  }, [
    activeLocal,
    activeServer,
    markerAssignee,
    markerAssigneeUserId,
    markerKind,
    markerNote,
    markerTarget,
    persistLocal,
    persistServer,
    useLegacyLocal,
  ]);

  const exportJson = useCallback(() => {
    if (typeof window === "undefined") return;
    if (useLegacyLocal) {
      const env = buildWorkspaceExportEnvelope(localWorkspaces);
      const blob = new Blob([JSON.stringify(env, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `servelink-investigation-workspaces-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const blob = new Blob(
      [
        JSON.stringify(
          {
            fileKind:
              "servelink_operational_investigation_workspace_export_phase_d_v1",
            exportedAtIso: nowIso(),
            workspaces: serverWorkspaces,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servelink-server-workspaces-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [localWorkspaces, serverWorkspaces, useLegacyLocal]);

  const onImportFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      try {
        const text = await file.text();
        const env = parseWorkspaceImportEnvelope(text);
        if (!env) {
          window.alert(COMMAND_CENTER_UX.workspaceImportError);
          return;
        }
        const merged = mergeImportedWorkspaces(localWorkspaces, env.workspaces);
        saveInvestigationWorkspaces(merged);
        refreshLocalOnly();
      } catch {
        window.alert(COMMAND_CENTER_UX.workspaceImportError);
      }
    },
    [localWorkspaces, refreshLocalOnly],
  );

  const migrateLocalToServer = useCallback(async () => {
    const local = loadInvestigationWorkspaces();
    if (local.length === 0) return;
    try {
      for (const w of local) {
        await createOperationalCommandWorkspace({
          title: w.title,
          notes: w.notes,
          handoffSummary: w.handoffSummary,
          bookmarks: w.bookmarks,
          markers: w.markers,
        });
      }
      await refreshServer();
    } catch (e) {
      window.alert(String(e instanceof Error ? e.message : e));
    }
  }, [refreshServer]);

  const onShare = useCallback(async () => {
    if (!activeServer || activeServer.myRole !== "owner") return;
    try {
      const ws = await shareOperationalCommandWorkspace(
        activeServer.id,
        shareEmail,
      );
      setServerWorkspaces((prev) =>
        prev.map((w) => (w.id === ws.id ? ws : w)),
      );
      setShareEmail("");
    } catch (e) {
      window.alert(String(e instanceof Error ? e.message : e));
    }
  }, [activeServer, shareEmail]);

  const listWorkspaces = useLegacyLocal ? localWorkspaces : serverWorkspaces;
  const active =
    useLegacyLocal ? activeLocal
    : activeServer ?
      activeServer
    : null;

  if (!hydrated) {
    return (
      <section
        id="operational-investigation-workspace-panel"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.workspacePanelTitle}
        className="rounded-2xl border border-slate-700/80 bg-slate-950/50 p-5 text-sm text-slate-400"
      >
        {COMMAND_CENTER_UX.coordinatedLoading}
      </section>
    );
  }

  return (
    <section
      id="operational-investigation-workspace-panel"
      aria-label={COMMAND_CENTER_UX.workspacePanelTitle}
      className="rounded-2xl border border-emerald-400/20 bg-emerald-950/12 p-5 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200/90">
            {COMMAND_CENTER_UX.workspacePanelTitle}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            {COMMAND_CENTER_UX.workspacePanelSubtitle}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-400">
              {COMMAND_CENTER_UX.workspaceServerStatusLabel}:{" "}
            </span>
            {serverLoading ?
              COMMAND_CENTER_UX.coordinatedLoading
            : serverOnline === false ?
              COMMAND_CENTER_UX.workspaceServerError
            : COMMAND_CENTER_UX.workspaceServerConnected}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {serverOnline !== false ?
            <button
              type="button"
              onClick={() => void refreshServer()}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              {COMMAND_CENTER_UX.workspaceRetryServer}
            </button>
          : null}
          <button
            type="button"
            onClick={onNew}
            className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-50 hover:bg-emerald-500/25"
          >
            {COMMAND_CENTER_UX.workspaceNewButton}
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
          >
            {COMMAND_CENTER_UX.workspaceExportButton}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
          >
            {COMMAND_CENTER_UX.workspaceImportButton}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void onImportFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.workspacePanelGovernanceNote}
      </p>

      {serverOnline === true ?
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/35 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {COMMAND_CENTER_UX.workspaceMigrateLocalHeading}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {COMMAND_CENTER_UX.workspaceMigrateLocalHint}
          </p>
          <button
            type="button"
            onClick={() => void migrateLocalToServer()}
            className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-100 hover:bg-emerald-500/15"
          >
            {COMMAND_CENTER_UX.workspaceMigrateButton}
          </button>
        </div>
      : null}

      {listWorkspaces.length === 0 ?
        <p className="mt-4 text-sm text-slate-500">
          {COMMAND_CENTER_UX.workspaceEmptyList}
        </p>
      : <div className="mt-5 flex flex-col gap-5 xl:flex-row">
          <div className="shrink-0 xl:w-56">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.workspaceSelectLabel}
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
            >
              {useLegacyLocal ?
                localWorkspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {COMMAND_CENTER_UX.workspaceLocalOnlyBadge} · {w.title}
                  </option>
                ))
              : serverWorkspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))
              }
            </select>
          </div>

          {active ?
            <div className="min-w-0 flex-1 space-y-4">
              {!useLegacyLocal && "myRole" in active ?
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full border border-white/10 px-2 py-0.5">
                    {active.myRole === "owner" ?
                      COMMAND_CENTER_UX.workspaceMyRoleOwner
                    : COMMAND_CENTER_UX.workspaceMyRoleCollaborator}
                  </span>
                  <span>
                    {COMMAND_CENTER_UX.workspaceOwnerLabel}:{" "}
                    <span className="text-slate-300">{active.ownerEmail}</span>
                  </span>
                </div>
              : null}

              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
                  aria-label="Workspace title"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (useLegacyLocal && activeLocal) {
                      persistLocal({
                        title: draft.title,
                        notes: draft.notes,
                        handoffSummary: draft.handoffSummary,
                      });
                    } else if (!useLegacyLocal && activeServer) {
                      void persistServer({
                        title: draft.title,
                        notes: draft.notes,
                        handoffSummary: draft.handoffSummary,
                        linkedReplaySessionId:
                          draft.linkedReplaySessionId.trim() || null,
                        linkedOlderReplaySessionId:
                          draft.linkedOlderReplaySessionId.trim() || null,
                        linkedNewerReplaySessionId:
                          draft.linkedNewerReplaySessionId.trim() || null,
                      });
                    }
                  }}
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/[0.14]"
                >
                  {COMMAND_CENTER_UX.workspaceSaveButton}
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100 hover:bg-rose-500/15"
                >
                  {COMMAND_CENTER_UX.workspaceDeleteButton}
                </button>
              </div>

              <label className="block text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  {COMMAND_CENTER_UX.workspaceNotesLabel}
                </span>
                <textarea
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, notes: e.target.value }))
                  }
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <label className="block text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  {COMMAND_CENTER_UX.workspaceHandoffLabel}
                </span>
                <textarea
                  value={draft.handoffSummary}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      handoffSummary: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
                />
              </label>

              {!useLegacyLocal ?
                <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {COMMAND_CENTER_UX.workspaceReplayAnchorsHeading}
                  </p>
                  <label className="mt-2 block text-[11px] text-slate-500">
                    {COMMAND_CENTER_UX.workspaceReplayPrimaryLabel}
                    <input
                      type="text"
                      value={draft.linkedReplaySessionId}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          linkedReplaySessionId: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 font-mono text-[11px] text-slate-100"
                    />
                  </label>
                  <label className="mt-2 block text-[11px] text-slate-500">
                    {COMMAND_CENTER_UX.workspaceReplayOlderLabel}
                    <input
                      type="text"
                      value={draft.linkedOlderReplaySessionId}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          linkedOlderReplaySessionId: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 font-mono text-[11px] text-slate-100"
                    />
                  </label>
                  <label className="mt-2 block text-[11px] text-slate-500">
                    {COMMAND_CENTER_UX.workspaceReplayNewerLabel}
                    <input
                      type="text"
                      value={draft.linkedNewerReplaySessionId}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          linkedNewerReplaySessionId: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 font-mono text-[11px] text-slate-100"
                    />
                  </label>
                </div>
              : null}

              {!useLegacyLocal && activeServer?.myRole === "owner" ?
                <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {COMMAND_CENTER_UX.workspaceShareHeading}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="email"
                      placeholder={
                        COMMAND_CENTER_UX.workspaceSharePlaceholder
                      }
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => void onShare()}
                      className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-[11px] font-medium text-emerald-100 hover:bg-emerald-500/15"
                    >
                      {COMMAND_CENTER_UX.workspaceShareButton}
                    </button>
                  </div>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {COMMAND_CENTER_UX.workspaceShareListHeading}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-400">
                    {activeServer?.shares.length === 0 ?
                      <li className="text-slate-600">—</li>
                    : activeServer?.shares.map((s) => (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/20 px-2 py-1"
                        >
                          <span>{s.sharedWithEmail}</span>
                          <button
                            type="button"
                            onClick={() =>
                              void (async () => {
                                try {
                                  const ws =
                                    await unshareOperationalCommandWorkspace(
                                      activeServer!.id,
                                      s.sharedWithUserId,
                                    );
                                  setServerWorkspaces((prev) =>
                                    prev.map((w) =>
                                      w.id === ws.id ? ws : w,
                                    ),
                                  );
                                } catch (e) {
                                  window.alert(
                                    String(
                                      e instanceof Error ?
                                        e.message
                                      : e,
                                    ),
                                  );
                                }
                              })()
                            }
                            className="text-[10px] text-rose-200 hover:underline"
                          >
                            {COMMAND_CENTER_UX.workspaceUnshareButton}
                          </button>
                        </li>
                      ))
                    }
                  </ul>
                </div>
              : null}

              {!useLegacyLocal ?
                <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {COMMAND_CENTER_UX.workspaceContinuityHeading}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {COMMAND_CENTER_UX.workspaceContinuitySubtitle}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void recordTeamContinuity("handoff_snapshot")
                      }
                      className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/15"
                    >
                      {COMMAND_CENTER_UX.workspaceContinuityHandoffButton}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void recordTeamContinuity("escalation_continuity")
                      }
                      className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100 hover:bg-amber-500/15"
                    >
                      {COMMAND_CENTER_UX.workspaceContinuityEscalationButton}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void recordTeamContinuity("shift_transition")
                      }
                      className="rounded-lg border border-sky-400/25 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100 hover:bg-sky-500/15"
                    >
                      {COMMAND_CENTER_UX.workspaceContinuityShiftButton}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void recordTeamContinuity("shared_bookmark_anchor")
                      }
                      className="rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-100 hover:bg-violet-500/15"
                    >
                      {COMMAND_CENTER_UX.workspaceContinuityBookmarkButton}
                    </button>
                  </div>
                </div>
              : null}

              {!useLegacyLocal ?
                <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <button
                    type="button"
                    onClick={() => setTimelineOpen((v) => !v)}
                    className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-300"
                  >
                    {COMMAND_CENTER_UX.workspaceTimelineHeading}{" "}
                    {timelineOpen ? "▼" : "▶"}
                  </button>
                  {timelineOpen ?
                    <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-[11px] text-slate-400">
                      {timeline.length === 0 ?
                        <li>{COMMAND_CENTER_UX.workspaceTimelineEmpty}</li>
                      : timeline.map((t) => (
                          <li key={t.id} className="rounded-md bg-black/15 px-2 py-1">
                            <span className="font-mono text-[10px] text-slate-600">
                              {t.createdAtIso}
                            </span>{" "}
                            <span className="text-emerald-200/90">
                              {t.eventKind}
                            </span>{" "}
                            <span className="text-slate-500">
                              {t.actorEmail}
                            </span>
                          </li>
                        ))
                      }
                    </ul>
                  : null}
                </div>
              : null}

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {COMMAND_CENTER_UX.workspaceBookmarksHeading}
                  </p>
                  <button
                    type="button"
                    onClick={addBookmark}
                    className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-100 hover:bg-emerald-500/15"
                  >
                    {COMMAND_CENTER_UX.workspaceBookmarkCaptureButton}
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-xs">
                  {active.bookmarks.length === 0 ?
                    <li className="text-slate-600">—</li>
                  : active.bookmarks.map((b) => (
                      <li key={b.id}>
                        <Link
                          href={b.href}
                          className="text-emerald-200 underline-offset-2 hover:underline"
                        >
                          {b.label}
                        </Link>
                        <span className="ml-2 font-mono text-[10px] text-slate-600">
                          {b.createdAtIso}
                        </span>
                      </li>
                    ))
                  }
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {COMMAND_CENTER_UX.workspaceMarkersHeading}
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                  <label className="block text-[11px] text-slate-500">
                    {COMMAND_CENTER_UX.workspaceMarkerKindLabel}
                    <select
                      value={markerKind}
                      onChange={(e) =>
                        setMarkerKind(e.target.value as InvestigationMarker["kind"])
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
                    >
                      <option value="incident">incident</option>
                      <option value="replay_session">replay_session</option>
                      <option value="replay_diff">replay_diff</option>
                      <option value="graph_node">graph_node</option>
                      <option value="freeform">freeform</option>
                    </select>
                  </label>
                  <input
                    type="text"
                    placeholder={
                      COMMAND_CENTER_UX.workspaceMarkerTargetPlaceholder
                    }
                    value={markerTarget}
                    onChange={(e) => setMarkerTarget(e.target.value)}
                    className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder={
                      COMMAND_CENTER_UX.workspaceMarkerAssigneePlaceholder
                    }
                    value={markerAssignee}
                    onChange={(e) => setMarkerAssignee(e.target.value)}
                    className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
                  />
                </div>
                {!useLegacyLocal ?
                  <input
                    type="text"
                    placeholder={
                      COMMAND_CENTER_UX.workspaceMarkerAssigneeUserPlaceholder
                    }
                    value={markerAssigneeUserId}
                    onChange={(e) => setMarkerAssigneeUserId(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 font-mono text-[11px] text-slate-100"
                  />
                : null}
                <textarea
                  placeholder={
                    COMMAND_CENTER_UX.workspaceMarkerNotePlaceholder
                  }
                  value={markerNote}
                  onChange={(e) => setMarkerNote(e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
                />
                <button
                  type="button"
                  onClick={addMarker}
                  className="mt-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-100 hover:bg-white/[0.14]"
                >
                  {COMMAND_CENTER_UX.workspaceMarkerAddButton}
                </button>

                <ul className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs text-slate-400">
                  {active.markers.length === 0 ?
                    <li className="text-slate-600">—</li>
                  : active.markers.map((m) => (
                      <li key={m.id} className="rounded-lg bg-black/20 px-2 py-2">
                        <span className="font-semibold text-slate-300">
                          {m.kind}
                        </span>
                        {m.targetId ?
                          <span className="ml-2 font-mono text-[10px] text-slate-500">
                            {m.targetId}
                          </span>
                        : null}
                        {m.assigneeDisplayName ?
                          <span className="ml-2 text-emerald-200/90">
                            @{m.assigneeDisplayName}
                          </span>
                        : null}
                        {m.assigneeUserId ?
                          <span className="ml-2 font-mono text-[10px] text-violet-200/90">
                            uid:{m.assigneeUserId.slice(0, 8)}…
                          </span>
                        : null}
                        <p className="mt-1 text-slate-300">{m.note}</p>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          : null}
        </div>
      }
    </section>
  );
}
