"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createReplayReviewSession,
  fetchOperationalCommandWorkspaces,
  fetchReplayReviewComments,
  fetchReplayReviewSessions,
  patchReplayReviewSession,
  postReplayReviewComment,
  type ReplayReviewCommentRow,
  type ReplayReviewSessionRow,
  type ServerOperationalWorkspace,
} from "@/lib/api/operationalCommandCollaboration";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";
import { setOperationalPresencePartial } from "@/lib/operational/operationalRealtimePresenceBridge";

const ANCHOR_KINDS = [
  "",
  "chronology_delta",
  "replay_diff",
  "intervention_bridge",
  "freeform",
] as const;

export function AdminOperationalReplayReviewPanel() {
  const [sessions, setSessions] = useState<ReplayReviewSessionRow[]>([]);
  const [workspaces, setWorkspaces] = useState<ServerOperationalWorkspace[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [activeSessionId, setActiveSessionId] = useState("");
  const [comments, setComments] = useState<ReplayReviewCommentRow[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [newTitle, setNewTitle] = useState("Replay review");
  const [newWorkspaceId, setNewWorkspaceId] = useState("");
  const [newPrimary, setNewPrimary] = useState("");
  const [newCompare, setNewCompare] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentAnchor, setCommentAnchor] =
    useState<(typeof ANCHOR_KINDS)[number]>("");

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sess, ws] = await Promise.all([
        fetchReplayReviewSessions(null),
        fetchOperationalCommandWorkspaces(),
      ]);
      setSessions(sess);
      setWorkspaces(ws);
      setActiveSessionId((cur) => {
        if (cur && sess.some((s) => s.id === cur)) return cur;
        return sess[0]?.id ?? "";
      });
    } catch (e) {
      setError(
        e instanceof Error ?
          e.message
        : COMMAND_CENTER_UX.replayReviewUnknownError,
      );
      setSessions([]);
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setOperationalPresencePartial({
      replayReviewSessionId:
        activeSessionId.trim() ? activeSessionId : null,
    });
  }, [activeSessionId]);

  const loadComments = useCallback(async (sessionId: string) => {
    if (!sessionId.trim()) {
      setComments([]);
      return;
    }
    setCommentsLoading(true);
    try {
      const rows = await fetchReplayReviewComments(sessionId);
      setComments(rows);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComments(activeSessionId);
  }, [activeSessionId, loadComments]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  const reportActionError = useCallback((e: unknown) => {
    setActionError(
      e instanceof Error ? e.message : COMMAND_CENTER_UX.replayReviewUnknownError,
    );
  }, []);

  const onCreateSession = useCallback(async () => {
    setActionError(null);
    try {
      const row = await createReplayReviewSession({
        title: newTitle.trim() || "Replay review",
        workspaceId: newWorkspaceId.trim() || null,
        replaySessionIdPrimary: newPrimary.trim() || null,
        replaySessionIdCompare: newCompare.trim() || null,
      });
      setSessions((prev) => [row, ...prev.filter((s) => s.id !== row.id)]);
      setActiveSessionId(row.id);
      setNewPrimary("");
      setNewCompare("");
    } catch (e) {
      reportActionError(e);
    }
  }, [newCompare, newPrimary, newTitle, newWorkspaceId, reportActionError]);

  const onPatchReviewState = useCallback(
    async (investigationReviewState: string) => {
      if (!activeSession) return;
      setActionError(null);
      try {
        const row = await patchReplayReviewSession(activeSession.id, {
          investigationReviewState,
        });
        setSessions((prev) =>
          prev.map((s) => (s.id === row.id ? row : s)),
        );
      } catch (e) {
        reportActionError(e);
      }
    },
    [activeSession, reportActionError],
  );

  const onPostComment = useCallback(async () => {
    if (!activeSession || !commentBody.trim()) return;
    setActionError(null);
    try {
      await postReplayReviewComment(activeSession.id, {
        body: commentBody.trim(),
        anchorKind: commentAnchor.trim() || undefined,
      });
      setCommentBody("");
      await loadComments(activeSession.id);
    } catch (e) {
      reportActionError(e);
    }
  }, [activeSession, commentAnchor, commentBody, loadComments, reportActionError]);

  if (loading) {
    return (
      <section
        id="operational-collaborative-replay-review-panel"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.replayReviewPanelTitle}
        className="rounded-2xl border border-slate-700/80 bg-slate-950/50 p-5 text-sm text-slate-400"
      >
        {COMMAND_CENTER_UX.coordinatedLoading}
      </section>
    );
  }

  if (error) {
    return (
      <section
        id="operational-collaborative-replay-review-panel"
        aria-label={COMMAND_CENTER_UX.replayReviewPanelTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void refreshAll()}
          className="mt-3 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-slate-100"
        >
          {COMMAND_CENTER_UX.replayReviewRetry}
        </button>
      </section>
    );
  }

  return (
    <section
      id="operational-collaborative-replay-review-panel"
      aria-label={COMMAND_CENTER_UX.replayReviewPanelTitle}
      className="rounded-2xl border border-sky-400/18 bg-sky-950/12 p-5 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200/90">
            {COMMAND_CENTER_UX.replayReviewPanelTitle}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            {COMMAND_CENTER_UX.replayReviewPanelSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshAll()}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/[0.14]"
        >
          {COMMAND_CENTER_UX.replayReviewReload}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.replayReviewGovernanceNote}
      </p>

      {actionError ? (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-50"
        >
          <p className="font-semibold uppercase tracking-wide text-amber-100">
            Replay action needs attention
          </p>
          <p className="mt-1">{actionError}</p>
          <p className="mt-1 text-amber-100/80">
            Retry after refreshing sessions. If it repeats, keep the review state unchanged and escalate with this message.
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {COMMAND_CENTER_UX.replayReviewCreateHeading}
          </p>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
            aria-label="Replay review title"
          />
          <label className="block text-[11px] text-slate-500">
            {COMMAND_CENTER_UX.replayReviewWorkspaceLinkLabel}
            <select
              value={newWorkspaceId}
              onChange={(e) => setNewWorkspaceId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-100"
            >
              <option value="">
                {COMMAND_CENTER_UX.replayReviewWorkspaceNone}
              </option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          </label>
          <input
            type="text"
            placeholder={COMMAND_CENTER_UX.replayReviewPrimaryPlaceholder}
            value={newPrimary}
            onChange={(e) => setNewPrimary(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 font-mono text-xs text-slate-100"
          />
          <input
            type="text"
            placeholder={COMMAND_CENTER_UX.replayReviewComparePlaceholder}
            value={newCompare}
            onChange={(e) => setNewCompare(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 font-mono text-xs text-slate-100"
          />
          <button
            type="button"
            onClick={() => void onCreateSession()}
            className="rounded-lg border border-sky-400/30 bg-sky-500/15 px-3 py-2 text-xs font-medium text-sky-50 hover:bg-sky-500/25"
          >
            {COMMAND_CENTER_UX.replayReviewCreateButton}
          </button>
        </div>

        <div className="space-y-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {COMMAND_CENTER_UX.replayReviewSessionsHeading}
          </p>
          <select
            value={activeSessionId}
            onChange={(e) => setActiveSessionId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
          >
            {sessions.length === 0 ?
              <option value="">{COMMAND_CENTER_UX.replayReviewNoSessions}</option>
            : sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} — {s.investigationReviewState}
                </option>
              ))
            }
          </select>

          {activeSession ?
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex flex-wrap gap-2">
                <span className="text-slate-500">
                  {COMMAND_CENTER_UX.replayReviewCreatorLabel}{" "}
                  <span className="text-slate-300">{activeSession.creatorEmail}</span>
                </span>
                {activeSession.workspaceTitle ?
                  <span className="text-slate-500">
                    {COMMAND_CENTER_UX.replayReviewLinkedWorkspaceLabel}{" "}
                    <span className="text-slate-300">
                      {activeSession.workspaceTitle}
                    </span>
                  </span>
                : null}
              </div>
              <label className="block text-[11px] text-slate-500">
                {COMMAND_CENTER_UX.replayReviewStateLabel}
                <select
                  value={activeSession.investigationReviewState}
                  onChange={(e) =>
                    void onPatchReviewState(e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-100"
                >
                  <option value="draft">draft</option>
                  <option value="open">open</option>
                  <option value="reviewed">reviewed</option>
                </select>
              </label>
              <p className="font-mono text-[10px] text-slate-600">
                primary: {activeSession.replaySessionIdPrimary ?? "—"}
                <br />
                compare: {activeSession.replaySessionIdCompare ?? "—"}
              </p>
              <p>
                <Link
                  href="#operational-replay-comparison-explorer"
                  className="text-sky-200 underline-offset-2 hover:underline"
                >
                  {COMMAND_CENTER_UX.replayReviewExplorerJump}
                </Link>
              </p>
            </div>
          : null}

          <div className="border-t border-white/10 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {COMMAND_CENTER_UX.replayReviewCommentsHeading}
            </p>
            {commentsLoading ?
              <p className="mt-2 text-xs text-slate-500">{COMMAND_CENTER_UX.coordinatedLoading}</p>
            : <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs">
                {comments.length === 0 ?
                  <li className="text-slate-600">—</li>
                : comments.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-lg border border-white/5 bg-black/20 px-2 py-2"
                    >
                      <span className="font-mono text-[10px] text-slate-600">
                        {c.authorEmail}
                      </span>
                      {c.anchorKind ?
                        <span className="ml-2 text-sky-200/80">
                          [{c.anchorKind}]
                        </span>
                      : null}
                      <p className="mt-1 text-slate-300">{c.body}</p>
                    </li>
                  ))
                }
              </ul>
            }

            <label className="mt-3 block text-[11px] text-slate-500">
              {COMMAND_CENTER_UX.replayReviewAnchorKindLabel}
              <select
                value={commentAnchor}
                onChange={(e) =>
                  setCommentAnchor(e.target.value as (typeof ANCHOR_KINDS)[number])
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
              >
                {ANCHOR_KINDS.map((k) => (
                  <option key={k || "none"} value={k}>
                    {k || "(none)"}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={3}
              placeholder={COMMAND_CENTER_UX.replayReviewCommentPlaceholder}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-100"
            />
            <button
              type="button"
              disabled={!activeSession || !commentBody.trim()}
              onClick={() => void onPostComment()}
              className="mt-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-100 hover:bg-white/[0.14] disabled:opacity-40"
            >
              {COMMAND_CENTER_UX.replayReviewCommentButton}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
