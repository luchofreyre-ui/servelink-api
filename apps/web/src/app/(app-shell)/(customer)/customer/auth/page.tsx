"use client";

import { AuthLoginForm } from "@/components/auth/AuthLoginForm";

export default function CustomerAuthPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <h1 className="text-2xl font-semibold">
        Sign in to your Nu Standard visit home
      </h1>

      <p className="text-sm text-slate-600 mb-6">
        View your bookings, payment status, visit notes, and service updates.
      </p>

      <AuthLoginForm role="customer" />
    </main>
  );
}
