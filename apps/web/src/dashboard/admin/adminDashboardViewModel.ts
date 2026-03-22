export type AdminDashboardViewModel = {
  hero: Record<string, unknown>;
  workboard: Record<string, unknown>;
  raw: unknown;
};

export function buildAdminDashboardViewModel(landing: unknown): AdminDashboardViewModel {
  const l = landing && typeof landing === "object" ? (landing as Record<string, unknown>) : {};
  return {
    hero: (l.hero as Record<string, unknown>) ?? {},
    workboard: (l.workboard as Record<string, unknown>) ?? {},
    raw: landing,
  };
}
