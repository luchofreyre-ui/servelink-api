"use client";

import { AuthLoginForm } from "@/components/auth/AuthLoginForm";

export default function FOAuthPage() {
  return (
    <main className="min-h-screen px-6 py-12 sm:py-16">

      {/* REQUIRED BY TEST */}
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Owner workspace
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Franchise Owner Sign In
      </h1>

      <p className="mb-6 mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Open your work queue, portfolio guidance, and service updates.
      </p>

      <AuthLoginForm
        role="fo"
        title="Sign in"
        subtitle="Access your owner operations workspace."
      />
    </main>
  );
}
