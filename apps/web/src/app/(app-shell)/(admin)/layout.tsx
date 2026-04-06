/**
 * Pass-through: admin route data (e.g. /admin/ops) is fetched in server components via
 * apiFetch + loadAdminOpsPageData. The app-shell AuthRoleGate is presentational for shell
 * chrome; ops page content does not wait on client-only gate state.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
