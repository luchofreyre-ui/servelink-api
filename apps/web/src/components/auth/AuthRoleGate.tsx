"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getStoredAccessToken,
  getStoredAuthUser,
  SERVELINK_ACCESS_TOKEN_COOKIE,
} from "@/lib/auth";
import { getLoginRouteForRole } from "@/lib/auth/authRoutes";
import { readJwtRole } from "@/lib/jwt-payload";

type UserRole = "admin" | "customer" | "fo";

type Props = {
  role: UserRole;
  children: React.ReactNode;
};

function readCookieToken(): string | null {
  if (typeof document === "undefined") return null;

  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(`${SERVELINK_ACCESS_TOKEN_COOKIE}=`)) {
      const value = part.slice(`${SERVELINK_ACCESS_TOKEN_COOKIE}=`.length);
      return decodeURIComponent(value);
    }
  }

  return null;
}

function readEffectiveRole(): {
  token: string | null;
  effectiveRole: UserRole | null;
} {
  const token = getStoredAccessToken() ?? readCookieToken();
  const user = getStoredAuthUser();
  const tokenRole = token ? readJwtRole(token) : null;
  const effectiveRole = (user?.role ?? tokenRole ?? null) as UserRole | null;

  return { token, effectiveRole };
}

export function AuthRoleGate({ role, children }: Props) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  const refreshAuth = useCallback(() => {
    const authState = readEffectiveRole();
    const isAllowed =
      Boolean(authState.token?.trim()) && authState.effectiveRole === role;

    setAllowed(isAllowed);
    setReady(true);
  }, [role]);

  useEffect(() => {
    refreshAuth();

    const onStorage = () => refreshAuth();
    const onFocus = () => refreshAuth();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAuth();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshAuth]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-lg text-zinc-500">
        Checking session...
      </div>
    );
  }

  if (!allowed) {
    const loginHref =
      typeof window !== "undefined" && role === "customer"
        ? `${getLoginRouteForRole(role)}?bookingContinuation=${encodeURIComponent(
            `${window.location.pathname}${window.location.search}`,
          )}`
        : getLoginRouteForRole(role);
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-zinc-900">Authentication required</h1>
        <p className="mt-4 text-lg text-zinc-600">
          You must sign in to access the {role} workspace.
        </p>
        <div className="mt-8">
          <a
            href={loginHref}
            className="inline-flex rounded-2xl bg-zinc-900 px-6 py-3 text-base font-semibold text-white hover:bg-zinc-800"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
