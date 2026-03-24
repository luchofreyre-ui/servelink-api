type TagRow = { tag: string; bookingCount: number };

export function AdminAuthorityTagCountTable(props: {
  title: string;
  subtitle?: string;
  rows: TagRow[];
  testId: string;
  emptyCopy: string;
  tagColumnHeader?: string;
  highlightTag?: string | null;
}) {
  const tagHeader = props.tagColumnHeader ?? "Tag";
  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/20"
      data-testid={props.testId}
    >
      <div className="border-b border-white/10 px-4 py-3.5">
        <h3 className="text-sm font-semibold text-white">{props.title}</h3>
        {props.subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-white/45">{props.subtitle}</p>
        ) : null}
      </div>
      <div className="max-h-56 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-[1] bg-neutral-950/95 text-xs uppercase tracking-[0.12em] text-white/45">
            <tr>
              <th className="px-4 py-2.5 font-medium">{tagHeader}</th>
              <th className="px-4 py-2.5 text-right font-medium">Bookings</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-sm leading-relaxed text-white/45"
                >
                  {props.emptyCopy}
                </td>
              </tr>
            ) : (
              props.rows.map((row) => {
                const hi =
                  props.highlightTag != null &&
                  props.highlightTag.trim() !== "" &&
                  row.tag === props.highlightTag.trim();
                return (
                  <tr
                    key={row.tag}
                    className={`border-t border-white/5 hover:bg-white/[0.03] ${hi ? "bg-amber-500/10 ring-1 ring-inset ring-amber-400/35" : ""}`}
                    data-highlighted={hi ? "true" : undefined}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-white/90">{row.tag}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-white/85">
                      {row.bookingCount}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
