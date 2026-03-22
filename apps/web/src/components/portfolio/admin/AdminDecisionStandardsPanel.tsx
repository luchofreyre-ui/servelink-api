import { getAllAdminDecisionStandards } from "@/standards/adminDecisionStandardSelectors";

export function AdminDecisionStandardsPanel() {
  const standards = getAllAdminDecisionStandards();
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Admin decision standards</h2>
      <p className="mt-1 text-xs text-slate-600">
        Recurring scenarios with expected ownership, follow-up, and acceptable deviation notes.
      </p>
      <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto text-xs">
        {standards.map((s) => (
          <li key={s.id} className="rounded-lg border border-slate-100 p-3">
            <p className="font-medium text-slate-900">{s.title}</p>
            <p className="mt-1 text-slate-600">{s.scenarioSignature}</p>
            <p className="mt-1 text-slate-800">
              <span className="font-medium">Path: </span>
              {s.recommendedDecisionPath}
            </p>
            <p className="mt-1 text-slate-700">
              Ownership: {s.expectedOwnershipPosture} · Follow-up: {s.followUpExpectation} ·{" "}
              {s.escalationLevel}
            </p>
            <p className="mt-1 text-slate-500">Deviation ok when: {s.whenDeviationAcceptable}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
