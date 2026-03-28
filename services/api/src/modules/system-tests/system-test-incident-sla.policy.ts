type SlaPolicyPriority = "critical" | "high" | "medium" | "low";

type SlaPolicyStatus =
  | "open"
  | "investigating"
  | "fixing"
  | "validating"
  | "resolved"
  | "dismissed";

export function getSystemTestIncidentSlaPolicyHours(params: {
  priority: SlaPolicyPriority;
  status: SlaPolicyStatus;
}): number | null {
  if (params.status === "resolved" || params.status === "dismissed") {
    return null;
  }

  switch (params.priority) {
    case "critical":
      return 4;
    case "high":
      return 12;
    case "medium":
      return 24;
    case "low":
      return 48;
    default:
      return null;
  }
}
