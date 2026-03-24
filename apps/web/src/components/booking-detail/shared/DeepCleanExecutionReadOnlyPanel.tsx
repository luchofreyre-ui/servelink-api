import type {
  DeepCleanExecutionAdminDisplay,
  DeepCleanExecutionCustomerDisplay,
} from "@/types/deepCleanProgram";

function statusLabel(
  s: "not_started" | "in_progress" | "completed",
): string {
  if (s === "completed") return "Completed";
  if (s === "in_progress") return "In progress";
  return "Not started";
}

function programStatusLabel(
  s: "not_started" | "in_progress" | "completed",
): string {
  if (s === "completed") return "Program: Completed";
  if (s === "in_progress") return "Program: In progress";
  return "Program: Not started";
}

function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function visitOperatorNote(
  v: DeepCleanExecutionCustomerDisplay["visits"][number],
  showOperatorNotes: boolean,
): string | null {
  if (!showOperatorNotes) return null;
  if (!("operatorNote" in v)) return null;
  const n = (v as { operatorNote?: string | null }).operatorNote;
  return typeof n === "string" && n.trim() ? n.trim() : null;
}

const light = {
  section: "rounded-xl border border-slate-200 bg-white p-4",
  title: "text-sm font-semibold text-slate-900",
  sub: "mt-1 text-xs text-slate-500",
  badge: "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800",
  progress: "text-sm text-slate-600",
  card: "rounded-lg border border-slate-200 bg-slate-50/80 p-4",
  visitTitle: "text-sm font-semibold text-slate-900",
  body: "text-sm text-slate-800",
  muted: "text-xs text-slate-500",
  statusPill:
    "rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200",
  dl: "mt-3 grid gap-1 text-xs text-slate-600",
  dt: "inline font-medium text-slate-700",
  taskList: "mt-2 list-disc pl-5 text-xs text-slate-700",
};

const dark = {
  section: "rounded-[28px] border border-white/10 bg-white/5 p-6",
  title: "text-lg font-semibold text-white",
  sub: "mt-1 text-sm text-white/60",
  badge: "rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90",
  progress: "text-sm text-white/70",
  card: "rounded-2xl border border-white/10 bg-black/25 p-4",
  visitTitle: "text-sm font-semibold text-white",
  body: "text-sm text-white/85",
  muted: "text-xs text-white/55",
  statusPill:
    "rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs font-medium text-white/90",
  dl: "mt-3 grid gap-1 text-xs text-white/65",
  dt: "inline font-medium text-white/80",
  taskList: "mt-2 list-disc pl-5 text-xs text-white/75",
};

export type DeepCleanExecutionReadOnlyPanelProps = {
  execution: DeepCleanExecutionCustomerDisplay | DeepCleanExecutionAdminDisplay;
  showOperatorNotes: boolean;
  tone?: "light" | "dark";
  title?: string;
  subtitle?: string;
};

export function DeepCleanExecutionReadOnlyPanel({
  execution,
  showOperatorNotes,
  tone = "light",
  title,
  subtitle,
}: DeepCleanExecutionReadOnlyPanelProps) {
  const t = tone === "dark" ? dark : light;
  const progressLine = `${execution.completedVisits} / ${execution.totalVisits} visits completed`;
  const heading =
    title ??
    (tone === "dark" ? "Deep clean visit status" : "Your deep clean visits");
  const sub =
    subtitle ??
    (tone === "dark"
      ? "Read-only inspection from booking screen data."
      : "Track progress for each scheduled visit.");

  return (
    <section className={t.section} data-testid="deep-clean-execution-readonly">
      <p className={t.title}>{heading}</p>
      <p className={t.sub}>{sub}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={t.badge}>{programStatusLabel(execution.programStatus)}</span>
        <span className={t.progress}>{progressLine}</span>
      </div>

      <ul className="mt-5 space-y-4">
        {execution.visits.map((v) => {
          const completedOn = formatWhen(v.completedAt);
          const startedOn = formatWhen(v.startedAt);
          const opNote = visitOperatorNote(v, showOperatorNotes);

          return (
            <li key={v.visitNumber} className={t.card}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className={t.visitTitle}>Visit {v.visitNumber}</p>
                  <p className={t.body}>{v.programLabel}</p>
                  {v.programDescription ? (
                    <p className={`mt-1 ${t.muted}`}>{v.programDescription}</p>
                  ) : null}
                </div>
                <span className={t.statusPill}>
                  Status: {statusLabel(v.status)}
                </span>
              </div>

              {v.taskBundleLabel ? (
                <p className={`mt-2 ${t.muted}`}>
                  Task bundle: {v.taskBundleLabel}
                </p>
              ) : null}

              {v.tasks.length > 0 ? (
                <ul className={t.taskList}>
                  {v.tasks.map((task) => (
                    <li key={task.taskId}>{task.label}</li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-2 ${t.muted}`}>
                  Expected task list unavailable for this visit.
                </p>
              )}

              <dl className={t.dl}>
                {startedOn && v.status !== "not_started" ? (
                  <div>
                    <dt className={t.dt}>Started: </dt>
                    <dd className="inline">{startedOn}</dd>
                  </div>
                ) : null}
                {completedOn && v.status === "completed" ? (
                  <div>
                    <dt className={t.dt}>Completed on: </dt>
                    <dd className="inline">{completedOn}</dd>
                  </div>
                ) : null}
                {v.status === "completed" &&
                v.actualDurationMinutes != null ? (
                  <div>
                    <dt className={t.dt}>Actual duration (minutes): </dt>
                    <dd className="inline">{v.actualDurationMinutes}</dd>
                  </div>
                ) : null}
                {opNote ? (
                  <div>
                    <dt className={t.dt}>Operator note: </dt>
                    <dd className="inline">{opNote}</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
