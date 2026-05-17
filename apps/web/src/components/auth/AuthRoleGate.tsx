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
      <div className="mx-auto max-w-5xl px-6 py-16 text-base text-zinc-500">
        Preparing your secure workspace...
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
      <div className="mx-auto max-w-5xl px-6 py-14 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Secure workspace
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Sign in to continue
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-zinc-600">
          Use your Nu Standard credentials to open this workspace.
        </p>
        <div className="mt-8">
          <a
            href={loginHref}
            className="inline-flex min-h-[46px] items-center rounded-2xl bg-zinc-900 px-6 py-3 text-base font-semibold text-white hover:bg-zinc-800"
          >
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
