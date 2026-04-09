"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, hasRole, isAuthenticated, type UserRole } from "@/lib/auth/authClient";
import { getDefaultRouteForRole, getRoleLabel } from "@/lib/auth/authRoutes";
import { loginWithApi } from "@/lib/auth/authApi";

interface AuthLoginFormProps {
  role: UserRole;
  title?: string;
  subtitle?: string;
}

export function AuthLoginForm({
  role,
  title,
  subtitle,
}: AuthLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedTitle = useMemo(
    () => title ?? `${getRoleLabel(role)} Login`,
    [role, title],
  );

  const resolvedSubtitle = useMemo(
    () =>
      subtitle ??
      `Sign in to access the ${getRoleLabel(role).toLowerCase()} workspace.`,
    [role, subtitle],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await loginWithApi({
        email: email.trim(),
        password,
        expectedRole: role,
      });

      router.replace(getDefaultRouteForRole(role));
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to sign in.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleContinueAsCurrentRole() {
    router.replace(getDefaultRouteForRole(role));
    router.refresh();
  }

  const alreadyAuthed = mounted && isAuthenticated();
  const alreadyCorrectRole = mounted && hasRole(role);
  const existingUser = mounted ? getAuthUser() : null;

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {resolvedTitle}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {resolvedSubtitle}
        </p>
      </div>

      {alreadyAuthed && alreadyCorrectRole ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            You are already signed in as {existingUser?.email ?? "this user"}.
          </p>
          <button
            type="button"
            onClick={handleContinueAsCurrentRole}
            className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Continue to dashboard
          </button>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            {role === "admin" ? "Admin email" : "Email"}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
            placeholder="name@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none"
            placeholder="Enter password"
            required
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
