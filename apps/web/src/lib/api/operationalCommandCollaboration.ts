import { apiFetch } from "@/lib/api";
import type {
  InvestigationBookmark,
  InvestigationMarker,
  InvestigationWorkspaceGovernancePhaseD,
} from "@/lib/operational/investigationWorkspaceStorage";

export const SERVER_WORKSPACE_ENGINE_VERSION =
  "collaborative_command_workspace_phase_d_v1" as const;

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function coerceBookmarks(raw: unknown): InvestigationBookmark[] {
  if (!Array.isArray(raw)) return [];
  const out: InvestigationBookmark[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" && r.id.trim() ? r.id : "";
    const href = typeof r.href === "string" ? r.href : "";
    const label =
      typeof r.label === "string" && r.label.trim() ? r.label : href;
    const createdAtIso =
      typeof r.createdAtIso === "string" && r.createdAtIso.trim() ?
        r.createdAtIso
      : new Date().toISOString();
    if (!id || !href) continue;
    out.push({ id, href, label, createdAtIso });
  }
  return out;
}

function coerceMarkers(raw: unknown): InvestigationMarker[] {
  if (!Array.isArray(raw)) return [];
  const out: InvestigationMarker[] = [];
  const kinds = new Set<InvestigationMarker["kind"]>([
    "incident",
    "replay_session",
    "replay_diff",
    "graph_node",
    "freeform",
  ]);
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const kind =
      typeof r.kind === "string" && kinds.has(r.kind as InvestigationMarker["kind"]) ?
        (r.kind as InvestigationMarker["kind"])
      : "freeform";
    const id = typeof r.id === "string" && r.id.trim() ? r.id : "";
    const note = typeof r.note === "string" ? r.note : "";
    const createdAtIso =
      typeof r.createdAtIso === "string" && r.createdAtIso.trim() ?
        r.createdAtIso
      : new Date().toISOString();
    if (!id || !note.trim()) continue;
    const m: InvestigationMarker = { id, kind, note, createdAtIso };
    if (typeof r.targetId === "string" && r.targetId.trim()) {
      m.targetId = r.targetId.trim();
    }
    if (typeof r.assigneeDisplayName === "string" && r.assigneeDisplayName.trim()) {
      m.assigneeDisplayName = r.assigneeDisplayName.trim();
    }
    if (typeof r.assigneeUserId === "string" && r.assigneeUserId.trim()) {
      m.assigneeUserId = r.assigneeUserId.trim();
    }
    out.push(m);
  }
  return out;
}

function coerceGovernance(row: unknown): InvestigationWorkspaceGovernancePhaseD {
  if (!row || typeof row !== "object") {
    return {
      noAutonomousCoordination: true,
      noAiExecutionAuthority: true,
      humanAuthoredNotesOnly: true,
      serverBackedCollaboration: true,
    };
  }
  return row as InvestigationWorkspaceGovernancePhaseD;
}

function parseWorkspace(row: unknown): ServerOperationalWorkspace | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  if (!id.trim()) return null;
  const title = typeof r.title === "string" ? r.title : "";
  const notes = typeof r.notes === "string" ? r.notes : "";
  const handoffSummary =
    typeof r.handoffSummary === "string" ? r.handoffSummary : "";
  const ownerUserId = typeof r.ownerUserId === "string" ? r.ownerUserId : "";
  const ownerEmail = typeof r.ownerEmail === "string" ? r.ownerEmail : "";
  const workspaceEngineVersion =
    typeof r.workspaceEngineVersion === "string" ?
      r.workspaceEngineVersion
    : SERVER_WORKSPACE_ENGINE_VERSION;
  const sharesRaw = r.shares;
  const shares: ServerOperationalWorkspace["shares"] = [];
  if (Array.isArray(sharesRaw)) {
    for (const s of sharesRaw) {
      if (!s || typeof s !== "object") continue;
      const sh = s as Record<string, unknown>;
      const sid = typeof sh.id === "string" ? sh.id : "";
      const sharedWithUserId =
        typeof sh.sharedWithUserId === "string" ? sh.sharedWithUserId : "";
      const sharedWithEmail =
        typeof sh.sharedWithEmail === "string" ? sh.sharedWithEmail : "";
      const sharedByUserId =
        typeof sh.sharedByUserId === "string" ? sh.sharedByUserId : "";
      const sharedByEmail =
        typeof sh.sharedByEmail === "string" ? sh.sharedByEmail : "";
      const createdAtIso =
        typeof sh.createdAtIso === "string" ? sh.createdAtIso : "";
      if (!sid || !sharedWithUserId) continue;
      shares.push({
        id: sid,
        sharedWithUserId,
        sharedWithEmail,
        sharedByUserId,
        sharedByEmail,
        createdAtIso,
      });
    }
  }

  const myRoleRaw = r.myRole;
  const myRole =
    myRoleRaw === "owner" || myRoleRaw === "collaborator" ? myRoleRaw : (
      myRoleRaw === "none"
    ) ?
      "none"
    : "none";

  return {
    id,
    workspaceEngineVersion,
    governance: coerceGovernance(r.governance),
    title,
    notes,
    handoffSummary,
    bookmarks: coerceBookmarks(r.bookmarks),
    markers: coerceMarkers(r.markers),
    ownerUserId,
    ownerEmail,
    linkedReplaySessionId:
      typeof r.linkedReplaySessionId === "string" ?
        r.linkedReplaySessionId
      : null,
    linkedOlderReplaySessionId:
      typeof r.linkedOlderReplaySessionId === "string" ?
        r.linkedOlderReplaySessionId
      : null,
    linkedNewerReplaySessionId:
      typeof r.linkedNewerReplaySessionId === "string" ?
        r.linkedNewerReplaySessionId
      : null,
    shares,
    createdAtIso:
      typeof r.createdAtIso === "string" ?
        r.createdAtIso
      : new Date().toISOString(),
    updatedAtIso:
      typeof r.updatedAtIso === "string" ?
        r.updatedAtIso
      : new Date().toISOString(),
    myRole,
  };
}

export type ServerOperationalWorkspace = {
  id: string;
  workspaceEngineVersion: string;
  governance: InvestigationWorkspaceGovernancePhaseD;
  title: string;
  notes: string;
  handoffSummary: string;
  bookmarks: InvestigationBookmark[];
  markers: InvestigationMarker[];
  ownerUserId: string;
  ownerEmail: string;
  linkedReplaySessionId: string | null;
  linkedOlderReplaySessionId: string | null;
  linkedNewerReplaySessionId: string | null;
  shares: Array<{
    id: string;
    sharedWithUserId: string;
    sharedWithEmail: string;
    sharedByUserId: string;
    sharedByEmail: string;
    createdAtIso: string;
  }>;
  createdAtIso: string;
  updatedAtIso: string;
  myRole: "owner" | "collaborator" | "none";
};

export type WorkspaceTimelineEvent = {
  id: string;
  eventKind: string;
  payloadJson: unknown;
  createdAtIso: string;
  actorUserId: string;
  actorEmail: string;
};

export type ReplayReviewSessionRow = {
  id: string;
  reviewEngineVersion: string;
  title: string;
  investigationReviewState: string;
  replaySessionIdPrimary: string | null;
  replaySessionIdCompare: string | null;
  aggregateWindow: string;
  workspaceId: string | null;
  workspaceTitle: string | null;
  createdByUserId: string;
  creatorEmail: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type ReplayReviewCommentRow = {
  id: string;
  body: string;
  anchorKind: string | null;
  anchorPayloadJson: unknown;
  authorUserId: string;
  authorEmail: string;
  createdAtIso: string;
};

function mapSessionRow(row: Record<string, unknown>): ReplayReviewSessionRow {
  return {
    id: String(row.id ?? ""),
    reviewEngineVersion: String(row.reviewEngineVersion ?? ""),
    title: typeof row.title === "string" ? row.title : "",
    investigationReviewState: String(row.investigationReviewState ?? ""),
    replaySessionIdPrimary:
      typeof row.replaySessionIdPrimary === "string" ?
        row.replaySessionIdPrimary
      : null,
    replaySessionIdCompare:
      typeof row.replaySessionIdCompare === "string" ?
        row.replaySessionIdCompare
      : null,
    aggregateWindow:
      typeof row.aggregateWindow === "string" ? row.aggregateWindow : "",
    workspaceId:
      typeof row.workspaceId === "string" ? row.workspaceId : null,
    workspaceTitle:
      typeof row.workspaceTitle === "string" ? row.workspaceTitle : null,
    createdByUserId:
      typeof row.createdByUserId === "string" ? row.createdByUserId : "",
    creatorEmail:
      typeof row.creatorEmail === "string" ? row.creatorEmail : "",
    createdAtIso:
      typeof row.createdAtIso === "string" ? row.createdAtIso : "",
    updatedAtIso:
      typeof row.updatedAtIso === "string" ? row.updatedAtIso : "",
  };
}

export async function fetchAdminMe(): Promise<{
  user_id: string;
  role: string;
}> {
  const res = await apiFetch("/me");
  const body = (await readJson(res)) as {
    user_id?: string;
    role?: string;
  } | null;
  if (!res.ok || !body?.user_id) {
    throw new Error(`Admin session required (${res.status})`);
  }
  return { user_id: body.user_id, role: String(body.role ?? "") };
}

export async function fetchOperationalCommandWorkspaces(): Promise<
  ServerOperationalWorkspace[]
> {
  const res = await apiFetch("/admin/operational-command-collaboration/workspaces");
  const body = (await readJson(res)) as {
    ok?: boolean;
    workspaces?: unknown[];
  } | null;
  if (!res.ok || !body?.ok || !Array.isArray(body.workspaces)) {
    throw new Error(`Operational workspaces failed (${res.status})`);
  }
  const out: ServerOperationalWorkspace[] = [];
  for (const w of body.workspaces) {
    const parsed = parseWorkspace(w);
    if (parsed) out.push(parsed);
  }
  return out;
}

export async function createOperationalCommandWorkspace(body: {
  title?: string;
  notes?: string;
  handoffSummary?: string;
  bookmarks?: InvestigationBookmark[];
  markers?: InvestigationMarker[];
  linkedReplaySessionId?: string | null;
  linkedOlderReplaySessionId?: string | null;
  linkedNewerReplaySessionId?: string | null;
}): Promise<ServerOperationalWorkspace> {
  const res = await apiFetch(
    "/admin/operational-command-collaboration/workspaces",
    { method: "POST", json: body },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    workspace?: unknown;
  } | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(`Create workspace failed (${res.status})`);
  }
  const ws = parseWorkspace(payload.workspace);
  if (!ws) throw new Error("Create workspace parse failed");
  return ws;
}

export async function patchOperationalCommandWorkspace(
  workspaceId: string,
  body: Record<string, unknown>,
): Promise<ServerOperationalWorkspace> {
  const res = await apiFetch(
    `/admin/operational-command-collaboration/workspaces/${encodeURIComponent(workspaceId)}`,
    { method: "PATCH", json: body },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    workspace?: unknown;
  } | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(`Patch workspace failed (${res.status})`);
  }
  const ws = parseWorkspace(payload.workspace);
  if (!ws) throw new Error("Patch workspace parse failed");
  return ws;
}

export async function deleteOperationalCommandWorkspace(
  workspaceId: string,
): Promise<void> {
  const res = await apiFetch(
    `/admin/operational-command-collaboration/workspaces/${encodeURIComponent(workspaceId)}`,
    { method: "DELETE" },
  );
  const payload = (await readJson(res)) as { ok?: boolean } | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(`Delete workspace failed (${res.status})`);
  }
}

export async function shareOperationalCommandWorkspace(
  workspaceId: string,
  email: string,
): Promise<ServerOperationalWorkspace> {
  const res = await apiFetch(
    `/admin/operational-command-collaboration/workspaces/${encodeURIComponent(workspaceId)}/share`,
    { method: "POST", json: { email } },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    workspace?: unknown;
  } | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(`Share workspace failed (${res.status})`);
  }
  const ws = parseWorkspace(payload.workspace);
  if (!ws) throw new Error("Share workspace parse failed");
  return ws;
}

export async function unshareOperationalCommandWorkspace(
  workspaceId: string,
  sharedWithUserId: string,
): Promise<ServerOperationalWorkspace> {
  const res = await apiFetch(
    `/admin/operational-command-collaboration/workspaces/${encodeURIComponent(workspaceId)}/share/${encodeURIComponent(sharedWithUserId)}`,
    { method: "DELETE" },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    workspace?: unknown;
  } | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(`Unshare workspace failed (${res.status})`);
  }
  const ws = parseWorkspace(payload.workspace);
  if (!ws) throw new Error("Unshare workspace parse failed");
  return ws;
}

export async function fetchWorkspaceCollaborationTimeline(
  workspaceId: string,
  take = 80,
): Promise<WorkspaceTimelineEvent[]> {
  const res = await apiFetch(
    `/admin/operational-command-collaboration/workspaces/${encodeURIComponent(workspaceId)}/timeline?take=${take}`,
  );
  const body = (await readJson(res)) as {
    ok?: boolean;
    timeline?: unknown[];
  } | null;
  if (!res.ok || !body?.ok || !Array.isArray(body.timeline)) {
    throw new Error(`Workspace timeline failed (${res.status})`);
  }
  const out: WorkspaceTimelineEvent[] = [];
  for (const row of body.timeline) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : "";
    const eventKind = typeof r.eventKind === "string" ? r.eventKind : "";
    const createdAtIso =
      typeof r.createdAtIso === "string" ? r.createdAtIso : "";
    const actorUserId =
      typeof r.actorUserId === "string" ? r.actorUserId : "";
    const actorEmail =
      typeof r.actorEmail === "string" ? r.actorEmail : "";
    if (!id || !eventKind) continue;
    out.push({
      id,
      eventKind,
      payloadJson: r.payloadJson,
      createdAtIso,
      actorUserId,
      actorEmail,
    });
  }
  return out;
}

export async function fetchReplayReviewSessions(
  workspaceId?: string | null,
): Promise<ReplayReviewSessionRow[]> {
  const qs =
    workspaceId?.trim() ?
      `?workspaceId=${encodeURIComponent(workspaceId.trim())}`
    : "";
  const res = await apiFetch(
    `/admin/operational-command-collaboration/replay-review/sessions${qs}`,
  );
  const body = (await readJson(res)) as {
    ok?: boolean;
    sessions?: unknown[];
  } | null;
  if (!res.ok || !body?.ok || !Array.isArray(body.sessions)) {
    throw new Error(`Replay review sessions failed (${res.status})`);
  }
  const out: ReplayReviewSessionRow[] = [];
  for (const row of body.sessions) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : "";
    if (!id) continue;
    out.push({
      id,
      reviewEngineVersion: String(r.reviewEngineVersion ?? ""),
      title: typeof r.title === "string" ? r.title : "",
      investigationReviewState: String(r.investigationReviewState ?? ""),
      replaySessionIdPrimary:
        typeof r.replaySessionIdPrimary === "string" ?
          r.replaySessionIdPrimary
        : null,
      replaySessionIdCompare:
        typeof r.replaySessionIdCompare === "string" ?
          r.replaySessionIdCompare
        : null,
      aggregateWindow:
        typeof r.aggregateWindow === "string" ? r.aggregateWindow : "",
      workspaceId:
        typeof r.workspaceId === "string" ? r.workspaceId : null,
      workspaceTitle:
        typeof r.workspaceTitle === "string" ? r.workspaceTitle : null,
      createdByUserId:
        typeof r.createdByUserId === "string" ? r.createdByUserId : "",
      creatorEmail:
        typeof r.creatorEmail === "string" ? r.creatorEmail : "",
      createdAtIso:
        typeof r.createdAtIso === "string" ? r.createdAtIso : "",
      updatedAtIso:
        typeof r.updatedAtIso === "string" ? r.updatedAtIso : "",
    });
  }
  return out;
}

export async function createReplayReviewSession(body: {
  title?: string;
  workspaceId?: string | null;
  investigationReviewState?: string;
  replaySessionIdPrimary?: string | null;
  replaySessionIdCompare?: string | null;
  aggregateWindow?: string;
}): Promise<ReplayReviewSessionRow> {
  const res = await apiFetch(
    "/admin/operational-command-collaboration/replay-review/sessions",
    { method: "POST", json: body },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    session?: unknown;
  } | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(`Create replay review failed (${res.status})`);
  }
  const row = payload.session as Record<string, unknown>;
  return mapSessionRow(row);
}

export async function fetchReplayReviewComments(
  sessionId: string,
): Promise<ReplayReviewCommentRow[]> {
  const res = await apiFetch(
    `/admin/operational-command-collaboration/replay-review/sessions/${encodeURIComponent(sessionId)}/comments`,
  );
  const body = (await readJson(res)) as {
    ok?: boolean;
    comments?: unknown[];
  } | null;
  if (!res.ok || !body?.ok || !Array.isArray(body.comments)) {
    throw new Error(`Replay review comments failed (${res.status})`);
  }
  const out: ReplayReviewCommentRow[] = [];
  for (const row of body.comments) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : "";
    const text = typeof r.body === "string" ? r.body : "";
    if (!id) continue;
    out.push({
      id,
      body: text,
      anchorKind:
        typeof r.anchorKind === "string" ? r.anchorKind : null,
      anchorPayloadJson: r.anchorPayloadJson,
      authorUserId:
        typeof r.authorUserId === "string" ? r.authorUserId : "",
      authorEmail:
        typeof r.authorEmail === "string" ? r.authorEmail : "",
      createdAtIso:
        typeof r.createdAtIso === "string" ? r.createdAtIso : "",
    });
  }
  return out;
}

export async function postReplayReviewComment(
  sessionId: string,
  body: {
    body: string;
    anchorKind?: string | null;
    anchorPayloadJson?: unknown;
  },
): Promise<ReplayReviewCommentRow> {
  const res = await apiFetch(
    `/admin/operational-command-collaboration/replay-review/sessions/${encodeURIComponent(sessionId)}/comments`,
    { method: "POST", json: body },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    comment?: unknown;
  } | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(`Post replay comment failed (${res.status})`);
  }
  const r = payload.comment as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    body: typeof r.body === "string" ? r.body : "",
    anchorKind:
      typeof r.anchorKind === "string" ? r.anchorKind : null,
    anchorPayloadJson: r.anchorPayloadJson,
    authorUserId:
      typeof r.authorUserId === "string" ? r.authorUserId : "",
    authorEmail:
      typeof r.authorEmail === "string" ? r.authorEmail : "",
    createdAtIso:
      typeof r.createdAtIso === "string" ? r.createdAtIso : "",
  };
}

export async function patchReplayReviewSession(
  sessionId: string,
  patch: Record<string, unknown>,
): Promise<ReplayReviewSessionRow> {
  const res = await apiFetch(
    `/admin/operational-command-collaboration/replay-review/sessions/${encodeURIComponent(sessionId)}`,
    { method: "PATCH", json: patch },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    session?: unknown;
  } | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(`Patch replay review failed (${res.status})`);
  }
  const row = payload.session as Record<string, unknown>;
  return mapSessionRow(row);
}

export async function postPhaseFTeamContinuityMarker(
  workspaceId: string,
  body: {
    markerKind: string;
    summary: string;
    payload?: Record<string, unknown>;
  },
): Promise<ServerOperationalWorkspace> {
  const res = await apiFetch(
    `/admin/operational-command-collaboration/workspaces/${encodeURIComponent(workspaceId)}/phase-f-continuity-markers`,
    { method: "POST", json: body },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    workspace?: unknown;
  } | null;
  if (!res.ok || !payload?.ok) {
    throw new Error(`Team continuity marker failed (${res.status})`);
  }
  const ws = parseWorkspace(payload.workspace);
  if (!ws) throw new Error("Workspace parse failed after continuity marker.");
  return ws;
}
