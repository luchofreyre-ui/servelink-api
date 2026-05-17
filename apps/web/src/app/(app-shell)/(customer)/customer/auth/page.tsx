"use client";

import { AuthLoginForm } from "@/components/auth/AuthLoginForm";

export default function CustomerAuthPage() {
  return (
    <main className="min-h-screen px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Customer workspace
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Sign in to your Nu Standard visit home
      </h1>

      <p className="mb-6 mt-2 max-w-xl text-sm leading-6 text-slate-600">
        View your bookings, payment status, visit notes, and service updates.
      </p>

      <AuthLoginForm
        role="customer"
        title="Sign in"
        subtitle="Access your visits, updates, and booking details."
      />
    </main>
  );
}
