"use client";

import { AuthLoginForm } from "@/components/auth/AuthLoginForm";

export default function CustomerAuthPage() {
  return (
    <main className="min-h-screen px-6 py-16">

      {/* REQUIRED BY TEST */}
      <h1 className="text-2xl font-semibold">
        Customer Sign In
      </h1>

      <p className="text-sm text-slate-600 mb-6">
        Sign in to view your bookings and service updates
      </p>

      <AuthLoginForm role="customer" />
    </main>
  );
}
