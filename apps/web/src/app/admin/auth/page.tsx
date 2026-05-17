"use client";

import { AuthLoginForm } from "@/components/auth/AuthLoginForm";

export default function AdminAuthPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Nu Standard operations
        </p>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">
          Sign in to the operations workspace
        </h1>

        <p className="mb-6 max-w-xl text-sm leading-6 text-slate-600">
          Use your admin credentials to review bookings, dispatch work, and operational updates.
        </p>

        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Admin email
          </label>

          <AuthLoginForm
            role="admin"
            title="Admin Login"
            subtitle="Sign in to access Nu Standard operations."
          />
        </div>

        <details className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <summary className="cursor-pointer font-semibold text-slate-600">
            Technical sign-in details
          </summary>
          <p className="mt-2 font-mono">POST /api/v1/auth/login</p>
        </details>
      </div>
    </main>
  );
}
