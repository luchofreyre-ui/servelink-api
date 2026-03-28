export function getDispatchExceptionSlaPolicyHours(params: {
  priority: "critical" | "high" | "medium" | "low";
  status:
    | "open"
    | "investigating"
    | "waiting"
    | "resolved"
    | "dismissed";
}): number | null {
  if (params.status === "resolved" || params.status === "dismissed") {
    return null;
  }
  switch (params.priority) {
    case "critical":
      return 2;
    case "high":
      return 8;
    case "medium":
      return 24;
    case "low":
      return 48;
    default:
      return null;
  }
}
