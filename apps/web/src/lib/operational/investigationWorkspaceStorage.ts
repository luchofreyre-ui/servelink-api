/**
 * Mega Phase C — saved investigation workspaces (browser-local persistence only).
 * Human-authored context + bookmarks — no autonomous coordination or server-side operator scoring.
 */

export const INVESTIGATION_WORKSPACE_ENGINE_VERSION =
  "collaborative_command_workspace_phase_c_v1" as const;

const STORAGE_KEY =
  "servelink.operationalInvestigationWorkspaces.phase_c.v1";

export type InvestigationWorkspaceGovernance = {
  noAutonomousCoordination: true;
  noAiExecutionAuthority: true;
  humanAuthoredNotesOnly: true;
  browserLocalPersistenceOnly: true;
};

/** Mega Phase D — governance envelope returned by server-backed workspace APIs. */
export type InvestigationWorkspaceGovernancePhaseD = {
  noAutonomousCoordination: true;
  noAiExecutionAuthority: true;
  humanAuthoredNotesOnly: true;
  serverBackedCollaboration: true;
};

export type InvestigationBookmark = {
  id: string;
  href: string;
  label: string;
  createdAtIso: string;
};

export type InvestigationMarker = {
  id: string;
  kind:
    | "incident"
    | "replay_session"
    | "replay_diff"
    | "graph_node"
    | "freeform";
  /** Optional stable id from warehouse payloads (incident id, replay session id, etc.). */
  targetId?: string;
  /** Display name only — not an authority assignment or roster integration. */
  assigneeDisplayName?: string;
  /** Mega Phase D — optional authenticated admin operator id (validated server-side). */
  assigneeUserId?: string;
  note: string;
  createdAtIso: string;
};

export type OperationalInvestigationWorkspace = {
  workspaceEngineVersion: typeof INVESTIGATION_WORKSPACE_ENGINE_VERSION;
  governance: InvestigationWorkspaceGovernance;
  id: string;
  title: string;
  notes: string;
  handoffSummary: string;
  bookmarks: InvestigationBookmark[];
  markers: InvestigationMarker[];
  updatedAtIso: string;
  createdAtIso: string;
};

export type InvestigationWorkspaceFileEnvelope = {
  fileKind: "servelink_operational_investigation_workspace_export_v1";
  exportedAtIso: string;
  workspaces: OperationalInvestigationWorkspace[];
};

function defaultGovernance(): InvestigationWorkspaceGovernance {
  return {
    noAutonomousCoordination: true,
    noAiExecutionAuthority: true,
    humanAuthoredNotesOnly: true,
    browserLocalPersistenceOnly: true,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export function newInvestigationWorkspace(
  title: string,
): OperationalInvestigationWorkspace {
  const t = nowIso();
  return {
    workspaceEngineVersion: INVESTIGATION_WORKSPACE_ENGINE_VERSION,
    governance: defaultGovernance(),
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto ?
        crypto.randomUUID()
      : `ws_${Math.random().toString(36).slice(2)}`,
    title: title.trim() || "Untitled investigation",
    notes: "",
    handoffSummary: "",
    bookmarks: [],
    markers: [],
    createdAtIso: t,
    updatedAtIso: t,
  };
}

export function loadInvestigationWorkspaces(): OperationalInvestigationWorkspace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: OperationalInvestigationWorkspace[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const rec = row as Record<string, unknown>;
      if (rec.workspaceEngineVersion !== INVESTIGATION_WORKSPACE_ENGINE_VERSION)
        continue;
      if (typeof rec.id !== "string" || !rec.id.trim()) continue;
      out.push(row as OperationalInvestigationWorkspace);
    }
    return out;
  } catch {
    return [];
  }
}

export function saveInvestigationWorkspaces(
  workspaces: OperationalInvestigationWorkspace[],
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
}

export function upsertInvestigationWorkspace(
  workspace: OperationalInvestigationWorkspace,
): OperationalInvestigationWorkspace[] {
  const cur = loadInvestigationWorkspaces();
  const next =
    workspace.updatedAtIso ? workspace : { ...workspace, updatedAtIso: nowIso() };
  const idx = cur.findIndex((w) => w.id === next.id);
  const merged =
    idx >= 0 ?
      [...cur.slice(0, idx), next, ...cur.slice(idx + 1)]
    : [...cur, next];
  saveInvestigationWorkspaces(merged);
  return merged;
}

export function deleteInvestigationWorkspace(id: string): void {
  const cur = loadInvestigationWorkspaces().filter((w) => w.id !== id);
  saveInvestigationWorkspaces(cur);
}

export function buildWorkspaceExportEnvelope(
  workspaces: OperationalInvestigationWorkspace[],
): InvestigationWorkspaceFileEnvelope {
  return {
    fileKind: "servelink_operational_investigation_workspace_export_v1",
    exportedAtIso: nowIso(),
    workspaces,
  };
}

export function parseWorkspaceImportEnvelope(
  raw: string,
): InvestigationWorkspaceFileEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const rec = parsed as Record<string, unknown>;
    if (rec.fileKind !== "servelink_operational_investigation_workspace_export_v1")
      return null;
    if (!Array.isArray(rec.workspaces)) return null;
    return parsed as InvestigationWorkspaceFileEnvelope;
  } catch {
    return null;
  }
}

export function mergeImportedWorkspaces(
  existing: OperationalInvestigationWorkspace[],
  imported: OperationalInvestigationWorkspace[],
): OperationalInvestigationWorkspace[] {
  const byId = new Map(existing.map((w) => [w.id, w]));
  for (const w of imported) {
    if (w.workspaceEngineVersion !== INVESTIGATION_WORKSPACE_ENGINE_VERSION)
      continue;
    const clone = {
      ...w,
      id:
        byId.has(w.id) ?
          (typeof crypto !== "undefined" && "randomUUID" in crypto ?
            crypto.randomUUID()
          : `ws_${Math.random().toString(36).slice(2)}`)
        : w.id,
      updatedAtIso: nowIso(),
    };
    byId.set(clone.id, clone);
  }
  return [...byId.values()].sort((a, b) =>
    a.updatedAtIso.localeCompare(b.updatedAtIso),
  );
}
