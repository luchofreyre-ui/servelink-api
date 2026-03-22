import type { DispatchConfigCompareResponse, DispatchConfigDiffItem } from "../api/types";

type DispatchConfigComparisonCardProps = {
  compare: DispatchConfigCompareResponse | undefined;
  isLoading: boolean;
};

function DiffRow({ d }: { d: DispatchConfigDiffItem }) {
  const impactClass =
    d.impactLevel === "high"
      ? "border-l-4 border-l-amber-500"
      : d.impactLevel === "medium"
        ? "border-l-4 border-l-blue-400"
        : "";
  return (
    <tr className={impactClass}>
      <td className="border-b border-gray-200 px-3 py-2 text-sm font-medium">{d.field}</td>
      <td className="border-b border-gray-200 px-3 py-2 text-sm text-gray-500">
        {d.changeType}
      </td>
      <td className="border-b border-gray-200 px-3 py-2 text-sm text-gray-600">
        {d.before !== undefined && d.before !== null ? String(d.before) : "—"}
      </td>
      <td className="border-b border-gray-200 px-3 py-2 text-sm text-gray-900">
        {d.after !== undefined && d.after !== null ? String(d.after) : "—"}
      </td>
      <td className="border-b border-gray-200 px-3 py-2 text-xs text-gray-500">
        {d.message}
      </td>
    </tr>
  );
}

export function DispatchConfigComparisonCard({
  compare,
  isLoading,
}: DispatchConfigComparisonCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Draft vs active</h2>
        <p className="text-sm text-gray-500">Loading comparison…</p>
      </div>
    );
  }

  if (!compare) {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Draft vs active</h2>
        <p className="text-sm text-gray-500">No comparison data.</p>
      </div>
    );
  }

  const { draft, active, summary, diffs } = compare;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Draft vs active</h2>
      <div className="mb-3 flex gap-4 text-sm">
        <span>
          Active: {active ? `v${active.version} ${active.label ?? ""}` : "none"}
        </span>
        <span>
          Draft: v{draft.version} {draft.label ?? ""}
        </span>
        {summary.changeCount > 0 && (
          <span className="text-amber-600">
            {summary.changeCount} change(s)
            {summary.highImpactChangeCount > 0 &&
              `, ${summary.highImpactChangeCount} high impact`}
          </span>
        )}
      </div>
      {diffs.length === 0 ? (
        <p className="text-sm text-gray-500">No differences.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500">
                <th className="px-3 py-2">Field</th>
                <th className="px-3 py-2">Change</th>
                <th className="px-3 py-2">Before</th>
                <th className="px-3 py-2">After</th>
                <th className="px-3 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((d, i) => (
                <DiffRow key={`${d.field}-${i}`} d={d} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
