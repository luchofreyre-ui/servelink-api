import { PropsWithChildren, useEffect } from "react";
import { useAdminSession } from "../providers/AdminSessionProvider";

const LOGIN_URL = "https://nustandardcleaning.com/login";
const ADMIN_NEXT = "/admin";

type AdminProtectedRouteProps = PropsWithChildren<{
  fallback?: React.ReactNode;
  forbiddenFallback?: React.ReactNode;
}>;

export function AdminProtectedRoute({
  children,
  fallback = <div className="flex items-center justify-center p-8">Loading session…</div>,
  forbiddenFallback = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="font-medium text-gray-900">You do not have access to this area.</p>
      <p className="mt-1 text-sm text-gray-600">Contact an administrator.</p>
    </div>
  ),
}: AdminProtectedRouteProps) {
  const { user, isAuthenticated, isBootstrapping } = useAdminSession();

  useEffect(() => {
    if (isBootstrapping) return;
    if (user === null && !isAuthenticated && typeof window !== "undefined") {
      window.location.href = `${LOGIN_URL}?next=${encodeURIComponent(ADMIN_NEXT)}`;
    }
  }, [isBootstrapping, user, isAuthenticated]);

  if (isBootstrapping) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated || user === null) {
    return null;
  }

  if (user.role !== "admin") {
    return <>{forbiddenFallback}</>;
  }

  return <>{children}</>;
}
