/**
 * Mega Phase F — merges coarse coordination hints from multiple strips without lifting full UI state.
 * Observable disclosures only (workspace ids, replay session ids, graph focus) — no autonomous routing.
 */

export type OperationalGraphInteractionSurface =
  | "graph_topology"
  | "graph_explorer";

export type OperationalPresenceDraft = {
  workspaceId?: string | null;
  replayReviewSessionId?: string | null;
  graphSelectedNodeId?: string | null;
  replayChronologyFrameId?: string | null;
  graphInteractionSurface?: OperationalGraphInteractionSurface | null;
};

let draft: OperationalPresenceDraft = {};
const listeners = new Set<() => void>();

export function subscribeOperationalPresenceDraft(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setOperationalPresencePartial(
  patch: Partial<OperationalPresenceDraft>,
): void {
  draft = { ...draft, ...patch };
  listeners.forEach((l) => l());
}

export function getOperationalPresenceDraft(): OperationalPresenceDraft {
  return { ...draft };
}

/** Publish graph/replay-coordinated focus for heartbeat payloads and peer disclosure. */
export function publishOperationalGraphFocus(
  surface: OperationalGraphInteractionSurface,
  nodeId: string | null,
): void {
  setOperationalPresencePartial({
    graphSelectedNodeId: nodeId,
    graphInteractionSurface: nodeId ? surface : null,
  });
}
