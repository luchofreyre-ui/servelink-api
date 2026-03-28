"use client";

type Props = {
  title: string;
  bodyExcerpt: string;
  payloadJson: unknown | null;
  loading?: boolean;
};

export function SystemTestsAutomationPayloadPreview(props: Props) {
  const { title, bodyExcerpt, payloadJson, loading } = props;

  let jsonStr = "";
  try {
    jsonStr =
      payloadJson !== null && payloadJson !== undefined ? JSON.stringify(payloadJson, null, 2) : "";
  } catch {
    jsonStr = "(could not stringify payload)";
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-lg font-semibold text-white">Payload preview</h2>
      {loading ? (
        <p className="text-sm text-white/55">Loading full payload…</p>
      ) : (
        <>
          <p className="text-sm font-medium text-white/85">{title}</p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/70">
            {bodyExcerpt || "—"}
          </pre>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Structured JSON</p>
          <pre className="max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
            {jsonStr || "—"}
          </pre>
        </>
      )}
    </section>
  );
}
