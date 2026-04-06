"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { SERVELINK_ACCESS_TOKEN_COOKIE } from "@/lib/auth";
import { getAuthUser, type UserRole } from "@/lib/auth/authClient";
import {
  getDefaultRouteForRole,
  getLoginRouteForRole,
  getRoleLabel,
} from "@/lib/auth/authRoutes";

interface AuthRoleGateProps {
  role: UserRole;
  children: React.ReactNode;
}

function readServelinkCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${SERVELINK_ACCESS_TOKEN_COOKIE}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) {
      const raw = part.slice(prefix.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

/**
 * 0 = guest, 1 = wrong role, 2 = allowed. Uses localStorage + mirrored session cookie
 * (same sources as `authClient` / RSC `apiFetch`).
 */
function encodeGateState(role: UserRole): number {
  if (typeof window === "undefined") return 0;

  const legacyToken = window.localStorage.getItem("token");
  const servelinkToken = window.localStorage.getItem("servelink_token");
  const cookieToken = readServelinkCookieToken();
  const authed = !!(
    legacyToken?.trim() ||
    servelinkToken?.trim() ||
    cookieToken?.trim()
  );

  if (!authed) return 0;

  const rawUser = window.localStorage.getItem("servelink_user");
  let userRole: UserRole | null = null;
  if (rawUser) {
    try {
      const u = JSON.parse(rawUser) as { role?: UserRole };
      if (u?.role === "admin" || u?.role === "fo" || u?.role === "customer") {
        userRole = u.role;
      }
    } catch {
      /* ignore */
    }
  }

  if (userRole === role) return 2;
  if (role === "admin" && (legacyToken?.trim() || cookieToken?.trim())) return 2;
  if (userRole != null && userRole !== role) return 1;
  return 0;
}

/**
 * SSR + first client paint match (guest). After mount, re-evaluate synchronously
 * so cookie + localStorage from Playwright/login are visible without relying on
 * layout-effect state updates that can fail to commit in some Next hydrations.
 */
export function AuthRoleGate({ role, children }: AuthRoleGateProps) {
  const pathname = usePathname() ?? "";
  const [hydrated, setHydrated] = useState(false);

  // Run before paint so the first browser paint after hydration can read storage/cookie
  // (Playwright seeds init scripts) instead of flashing the guest shell until useEffect.
  useLayoutEffect(() => {
    setHydrated(true);
  }, []);

  const state = hydrated ? encodeGateState(role) : 0;

  // /admin/ops RSC data is loaded on the server with cookies; do not hide the page behind
  // the guest shell until client hydration (which broke SSR ops drilldowns).
  const allowAdminOpsBeforeHydration =
    role === "admin" && pathname.startsWith("/admin/ops");

  if (state === 0 && !allowAdminOpsBeforeHydration) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Authentication required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            You must sign in to access the {getRoleLabel(role).toLowerCase()} workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={getLoginRouteForRole(role)}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Go to login
            </Link>
            <Link
              href={getLoginRouteForRole(role)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state === 1) {
    const user = getAuthUser();
    const resolvedUserRole = user?.role ?? null;
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Authentication required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            This workspace requires {getRoleLabel(role).toLowerCase()} access.
            {resolvedUserRole
              ? ` You are currently signed in as ${getRoleLabel(resolvedUserRole).toLowerCase()}.`
              : ""}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={resolvedUserRole ? getDefaultRouteForRole(resolvedUserRole) : "/"}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Go to your dashboard
            </Link>
            <Link
              href={getLoginRouteForRole(role)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              Sign in with correct role
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
