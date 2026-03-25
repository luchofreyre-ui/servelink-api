/** Dispatched after admin command-center mutations so `/admin/activity` can refetch. */
export const ADMIN_ACTIVITY_REFRESH_EVENT = "admin-activity-refresh";

export function dispatchAdminActivityRefresh(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(ADMIN_ACTIVITY_REFRESH_EVENT));
}
