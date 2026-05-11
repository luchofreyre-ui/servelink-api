export function maintenanceTimelineWarning(code: string): string {
  const m: Record<string, string> = {
    replay_persisted_false:
      "Replay computed without persisting a checkpoint (dry-run).",
    replay_idempotent_hit:
      "Checkpoint already existed for this subject, source, and input fingerprint.",
    replay_snapshot_stale_governance:
      "Snapshot predates merged governance fields — replay still runs from parsed blobs.",
  };
  return m[code] ?? code;
}
