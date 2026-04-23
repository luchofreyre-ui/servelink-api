export type RecurringLifecycleAction =
  | "modify_next_visit"
  | "skip_next_visit"
  | "pause"
  | "resume"
  | "cancel";

export function getRecurringLifecycleActionLabel(
  action: RecurringLifecycleAction,
): string {
  switch (action) {
    case "modify_next_visit":
      return "Modify next visit";
    case "skip_next_visit":
      return "Skip next visit";
    case "pause":
      return "Pause plan";
    case "resume":
      return "Resume plan";
    case "cancel":
      return "Cancel plan";
    default:
      return action;
  }
}

export function getRecurringLifecycleActionDescription(
  action: RecurringLifecycleAction,
): string {
  switch (action) {
    case "modify_next_visit":
      return "Change the upcoming visit without rewriting the recurring plan history.";
    case "skip_next_visit":
      return "Skip only the next scheduled visit while keeping the recurring plan active.";
    case "pause":
      return "Temporarily stop future recurring scheduling until the plan is resumed.";
    case "resume":
      return "Resume recurring scheduling using the existing cadence and plan settings.";
    case "cancel":
      return "Permanently stop future recurring scheduling for this plan.";
    default:
      return "";
  }
}

export function getRecurringLifecycleActionTone(
  action: RecurringLifecycleAction,
): "default" | "warning" | "danger" {
  switch (action) {
    case "cancel":
      return "danger";
    case "pause":
    case "skip_next_visit":
      return "warning";
    default:
      return "default";
  }
}
