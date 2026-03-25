export function FoKnowledgeEmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Quick Solve</h2>
        <p className="text-sm leading-6 text-slate-600">
          Select a surface, problem, and severity to get a field-ready recommendation with
          method guidance, tools, chemical notes, warnings, and escalation criteria.
        </p>
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Start by choosing the exact cleaning situation on the left. This is built for
            real in-field decisions, not long-form reading.
          </p>
        </div>
      </div>
    </div>
  );
}
