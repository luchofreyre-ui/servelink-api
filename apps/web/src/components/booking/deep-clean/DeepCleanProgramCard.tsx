import type { DeepCleanProgramDisplay } from "@/types/deepCleanProgram";

function formatUsdFromCents(cents: number): string {
  const n = Number.isFinite(cents) ? cents / 100 : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export type DeepCleanProgramCardProps = {
  program: DeepCleanProgramDisplay;
  /** FO-style headings: "Visit N expectations" */
  expectationHeadings?: boolean;
  /** Hide price rows when zero (e.g. review preview before submit). */
  hideZeroPrices?: boolean;
  /** When wrapped by an outer section title (e.g. FO job page). */
  hideEyebrow?: boolean;
  className?: string;
};

export function DeepCleanProgramCard({
  program,
  expectationHeadings = false,
  hideZeroPrices = false,
  hideEyebrow = false,
  className = "",
}: DeepCleanProgramCardProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        {!hideEyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Deep clean program
          </p>
        ) : null}
        <h3
          className={`text-xl font-semibold text-slate-900 ${hideEyebrow ? "" : "mt-2"}`}
        >
          {program.title}
        </h3>
        {program.description ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {program.description}
          </p>
        ) : null}
        {!hideZeroPrices && program.totalPriceCents > 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Program total:{" "}
            <span className="font-semibold text-slate-900">
              {formatUsdFromCents(program.totalPriceCents)}
            </span>
          </p>
        ) : null}
      </div>

      <ul className="space-y-5">
        {program.visits.map((v) => (
          <li
            key={v.visitNumber}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4"
          >
            <p className="text-sm font-semibold text-slate-900">
              {expectationHeadings
                ? `Visit ${v.visitNumber} expectations`
                : v.label}
            </p>
            {expectationHeadings ? (
              <p className="mt-1 text-sm text-slate-700">{v.label}</p>
            ) : null}
            {v.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {v.description}
              </p>
            ) : null}
            {!hideZeroPrices && v.priceCents > 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                Est. {formatUsdFromCents(v.priceCents)}
              </p>
            ) : null}
            {v.taskBundleLabel ? (
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Task bundle: </span>
                {v.taskBundleLabel}
              </p>
            ) : v.taskBundleId ? (
              <p className="mt-2 text-xs text-slate-400">
                Bundle id:{" "}
                <span className="font-mono text-slate-600">{v.taskBundleId}</span>
              </p>
            ) : null}
            {v.tasks.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {v.tasks.map((t) => (
                  <li key={t.taskId}>
                    <span className="font-medium">{t.label}</span>
                    {t.category ? (
                      <span className="text-slate-500"> · {t.category}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : hideZeroPrices ? null : (
              <p className="mt-2 text-xs text-slate-500">
                Task checklist unavailable for this visit.
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
