import {
  getRecurringLifecycleActionDescription,
  getRecurringLifecycleActionLabel,
  getRecurringLifecycleActionTone,
  type RecurringLifecycleAction,
} from "./recurringLifecycleLabels";

type RecurringLifecycleActionCardProps = {
  action: RecurringLifecycleAction;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

function getToneClasses(tone: "default" | "warning" | "danger") {
  switch (tone) {
    case "danger":
      return {
        card: "border-red-200 bg-red-50",
        title: "text-red-950",
        body: "text-red-800",
        button:
          "border-red-300 bg-white text-red-900 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50",
      };
    case "warning":
      return {
        card: "border-amber-200 bg-amber-50",
        title: "text-amber-950",
        body: "text-amber-800",
        button:
          "border-amber-300 bg-white text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50",
      };
    default:
      return {
        card: "border-neutral-200 bg-white",
        title: "text-neutral-950",
        body: "text-neutral-600",
        button:
          "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50",
      };
  }
}

export function RecurringLifecycleActionCard({
  action,
  disabled = false,
  loading = false,
  onClick,
}: RecurringLifecycleActionCardProps) {
  const tone = getRecurringLifecycleActionTone(action);
  const classes = getToneClasses(tone);

  return (
    <div className={`rounded-[24px] border p-5 ${classes.card}`}>
      <div className="space-y-2">
        <h3 className={`text-base font-semibold ${classes.title}`}>
          {getRecurringLifecycleActionLabel(action)}
        </h3>
        <p className={`text-sm leading-6 ${classes.body}`}>
          {getRecurringLifecycleActionDescription(action)}
        </p>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || loading}
          className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold transition ${classes.button}`}
        >
          {loading ? "Working..." : getRecurringLifecycleActionLabel(action)}
        </button>
      </div>
    </div>
  );
}
