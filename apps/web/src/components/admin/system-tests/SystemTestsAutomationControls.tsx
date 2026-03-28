"use client";

type Props = {
  busy: string | null;
  onDigest: () => void;
  onAlert: () => void;
  onTriage: () => void;
  onSendLatest?: () => void;
  selectedJobId: string | null;
  onSendSelected?: () => void;
};

export function SystemTestsAutomationControls(props: Props) {
  const { busy, onDigest, onAlert, onTriage, onSendLatest, selectedJobId, onSendSelected } = props;

  const btn =
    "rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-40";

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-lg font-semibold text-white">Manual triggers</h2>
      <p className="text-xs text-white/45">
        Use these to validate automation without waiting for cron. Jobs are persisted on the API.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={busy !== null} onClick={onDigest}>
          {busy === "digest" ? "Running…" : "Generate digest now"}
        </button>
        <button type="button" className={btn} disabled={busy !== null} onClick={onAlert}>
          {busy === "alert" ? "Running…" : "Evaluate regression alert now"}
        </button>
        <button type="button" className={btn} disabled={busy !== null} onClick={onTriage}>
          {busy === "triage" ? "Running…" : "Generate triage report now"}
        </button>
        {onSendLatest ? (
          <button type="button" className={btn} disabled={busy !== null} onClick={onSendLatest}>
            {busy === "send" ? "Sending…" : "Send latest pending (if webhook set)"}
          </button>
        ) : null}
        {onSendSelected && selectedJobId ? (
          <button type="button" className={btn} disabled={busy !== null} onClick={onSendSelected}>
            {busy === "sendSel" ? "Sending…" : "Resend selected job"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
