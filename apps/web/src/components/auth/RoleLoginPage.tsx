"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setStoredAccessToken } from "@/lib/auth/session";
import { readJwtRole } from "@/lib/jwt-payload";
import { WEB_ENV } from "@/lib/env";

type LoginResponse = {
  id: string;
  email: string;
  role: string;
  phone: string | null;
  accessToken: string;
};

type Props = {
  expectedRole: "customer" | "fo";
  title: string;
  description: string;
  defaultNextPath: string;
};

export function RoleLoginPage({
  expectedRole,
  title,
  description,
  defaultNextPath,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const next = searchParams?.get("next");
    if (!next || !next.startsWith("/")) {
      return defaultNextPath;
    }
    if (expectedRole === "customer" && !next.startsWith("/customer")) {
      return defaultNextPath;
    }
    if (expectedRole === "fo" && !next.startsWith("/fo")) {
      return defaultNextPath;
    }
    return next;
  }, [searchParams, defaultNextPath, expectedRole]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${WEB_ENV.apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      let payload: LoginResponse | { message?: string } | null = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message?: string }).message || "Login failed.")
            : "Login failed.";
        throw new Error(message);
      }

      if (
        !payload ||
        typeof payload !== "object" ||
        !("accessToken" in payload) ||
        typeof payload.accessToken !== "string" ||
        payload.accessToken.trim().length === 0
      ) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      const tokenRole =
        readJwtRole(payload.accessToken) ??
        (typeof payload.role === "string" ? payload.role : null);

      if (tokenRole !== expectedRole) {
        throw new Error(
          expectedRole === "customer"
            ? "This account is not a customer account. Use the correct sign-in page."
            : "This account is not a franchise owner account. Use the correct sign-in page.",
        );
      }

      setStoredAccessToken(payload.accessToken);
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          Servelink
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

        <form
          onSubmit={handleLoginSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="underline">
            Home
          </Link>
          {" · "}
          {expectedRole === "customer" ? (
            <Link href="/fo/auth" className="underline">
              Franchise owner sign-in
            </Link>
          ) : (
            <Link href="/customer/auth" className="underline">
              Customer sign-in
            </Link>
          )}
        </p>
      </div>
    </main>
  );
}
