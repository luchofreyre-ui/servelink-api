import { apiFetch } from "@/lib/api";

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export type OperationalPresenceOperatorSnapshot = {
  userId: string;
  email: string;
  surface: string;
  workspaceId: string | null;
  replayReviewSessionId: string | null;
  graphSelectedNodeId: string | null;
  replayChronologyFrameId: string | null;
  warRoomActive: boolean;
  payloadJson: unknown;
  updatedAtIso: string;
};

export type OperationalGraphCollaborationAnnotationRow = {
  id: string;
  graphEngineVersion: string;
  aggregateWindow: string;
  graphNodeId: string;
  authorUserId: string;
  authorEmail: string;
  body: string;
  createdAtIso: string;
};

export async function postOperationalPresenceHeartbeat(body: {
  surface: string;
  workspaceId?: string | null;
  replayReviewSessionId?: string | null;
  graphSelectedNodeId?: string | null;
  replayChronologyFrameId?: string | null;
  warRoomActive?: boolean;
  payloadJson?: unknown;
}): Promise<OperationalPresenceOperatorSnapshot> {
  const res = await apiFetch(`/admin/operational-command-presence/heartbeat`, {
    method: "POST",
    json: body,
  });
  const payload = (await readJson(res)) as {
    ok?: boolean;
    presence?: OperationalPresenceOperatorSnapshot;
  } | null;
  if (!res.ok || !payload?.ok || !payload.presence) {
    throw new Error(`Presence heartbeat failed (${res.status})`);
  }
  return payload.presence;
}

export async function fetchOperationalPresenceSnapshot(workspaceId?: string | null): Promise<{
  staleAfterMs: number;
  operators: OperationalPresenceOperatorSnapshot[];
}> {
  const q =
    workspaceId?.trim() ?
      `?workspaceId=${encodeURIComponent(workspaceId.trim())}`
    : "";
  const res = await apiFetch(
    `/admin/operational-command-presence/snapshot${q}`,
    { method: "GET" },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    staleAfterMs?: number;
    operators?: OperationalPresenceOperatorSnapshot[];
  } | null;
  if (!res.ok || !payload?.ok || !Array.isArray(payload.operators)) {
    throw new Error(`Presence snapshot failed (${res.status})`);
  }
  return {
    staleAfterMs:
      typeof payload.staleAfterMs === "number" ? payload.staleAfterMs : 120_000,
    operators: payload.operators,
  };
}

export async function fetchGraphCollaborationAnnotations(
  graphNodeId: string,
  take?: number,
): Promise<OperationalGraphCollaborationAnnotationRow[]> {
  const q = new URLSearchParams();
  q.set("graphNodeId", graphNodeId);
  if (take != null && Number.isFinite(take)) q.set("take", String(take));
  const res = await apiFetch(
    `/admin/operational-command-presence/graph-annotations?${q.toString()}`,
    { method: "GET" },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    annotations?: OperationalGraphCollaborationAnnotationRow[];
  } | null;
  if (!res.ok || !payload?.ok || !Array.isArray(payload.annotations)) {
    throw new Error(`Graph annotations failed (${res.status})`);
  }
  return payload.annotations;
}

export async function postGraphCollaborationAnnotation(body: {
  graphNodeId: string;
  body: string;
}): Promise<OperationalGraphCollaborationAnnotationRow> {
  const res = await apiFetch(
    `/admin/operational-command-presence/graph-annotations`,
    { method: "POST", json: body },
  );
  const payload = (await readJson(res)) as {
    ok?: boolean;
    annotation?: OperationalGraphCollaborationAnnotationRow;
  } | null;
  if (!res.ok || !payload?.ok || !payload.annotation) {
    throw new Error(`Post graph annotation failed (${res.status})`);
  }
  return payload.annotation;
}
