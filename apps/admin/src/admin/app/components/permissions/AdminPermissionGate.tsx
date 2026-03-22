import { PropsWithChildren } from "react";
import type { AdminPermission } from "../../types/permissions";
import { useAdminSession } from "../../providers/AdminSessionProvider";

type AdminPermissionGateProps = PropsWithChildren<{
  permissions: AdminPermission[];
  fallback?: React.ReactNode;
}>;

export function AdminPermissionGate({
  permissions,
  fallback = null,
  children,
}: AdminPermissionGateProps) {
  const { user } = useAdminSession();

  const hasAllPermissions =
    user?.permissions?.every
      ? permissions.every((permission) => user.permissions.includes(permission))
      : false;

  if (!hasAllPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
