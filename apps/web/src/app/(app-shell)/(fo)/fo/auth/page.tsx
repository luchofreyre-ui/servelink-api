"use client";

import { AuthLoginForm } from "@/components/auth/AuthLoginForm";

export default function FOAuthPage() {
  return (
    <main className="min-h-screen px-6 py-16">

      {/* REQUIRED BY TEST */}
      <h1 className="text-2xl font-semibold">
        Franchise Owner Sign In
      </h1>

      <p className="text-sm text-slate-600 mb-6">
        Sign in to open your work queue
      </p>

      <AuthLoginForm role="fo" />
    </main>
  );
}
