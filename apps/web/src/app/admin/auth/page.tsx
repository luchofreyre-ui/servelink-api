"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setStoredAccessToken } from "@/lib/auth";

type LoginResponse = {
  id: string;
  email: string;
  role: string;
  phone: string | null;
  accessToken: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:3001";

export default function AdminAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const next = searchParams?.get("next");
    if (!next || !next.startsWith("/")) {
      return "/admin";
    }
    return next;
  }, [searchParams]);

  const [mode, setMode] = useState<"login" | "paste-token">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
            ? payload.message || "Login failed."
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

  function handleManualTokenSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmed = manualToken.trim();
    if (!trimmed) {
      setErrorMessage("Paste a valid JWT.");
      return;
    }

    setStoredAccessToken(trimmed);
    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/70">
              Servelink Admin Access
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Authenticate the real admin console.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                The backend login contract is live. This page is a temporary
                bootstrap so you can obtain a valid admin JWT and unlock the
                real dispatch operations UI.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium text-white">
                  Backend route
                </div>
                <div className="mt-2 text-sm text-white/65">
                  POST /api/v1/auth/login
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium text-white">
                  Stored token key
                </div>
                <div className="mt-2 text-sm text-white/65">
                  localStorage["token"]
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium text-white">
                  Redirect target
                </div>
                <div className="mt-2 text-sm text-white/65">{nextPath}</div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div className="mb-6 flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                }}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  mode === "login"
                    ? "bg-white text-black"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("paste-token");
                  setErrorMessage(null);
                }}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  mode === "paste-token"
                    ? "bg-white text-black"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                Paste Token
              </button>
            </div>

            {mode === "login" ? (
              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <label className="text-sm text-white/80" htmlFor="email">
                    Admin email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-0 placeholder:text-white/30 focus:border-white/30"
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/80" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-0 placeholder:text-white/30 focus:border-white/30"
                    placeholder="Enter password"
                    required
                  />
                </div>

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Signing in..." : "Sign in to admin"}
                </button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleManualTokenSubmit}>
                <div className="space-y-2">
                  <label className="text-sm text-white/80" htmlFor="jwt">
                    JWT access token
                  </label>
                  <textarea
                    id="jwt"
                    value={manualToken}
                    onChange={(event) => setManualToken(event.target.value)}
                    className="min-h-[220px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                    placeholder="Paste accessToken here"
                    required
                  />
                </div>

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Save token and continue
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
