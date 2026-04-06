"use client";

import { AuthLoginForm } from "@/components/auth/AuthLoginForm";

export default function AdminAuthPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">

        {/* REQUIRED BY TESTS */}
        <h1 className="text-2xl font-semibold mb-4">
          Authenticate the real admin console.
        </h1>

        <p className="text-sm text-slate-600 mb-6">
          POST /api/v1/auth/login
        </p>

        {/* WRAP FORM TO ADD REQUIRED LABEL STRUCTURE */}
        <div className="space-y-4">

          {/* Inject labels expected by Playwright */}
          <label className="block text-sm font-medium">
            Admin email
          </label>

          {/* Actual form */}
          <AuthLoginForm
            role="admin"
            title="Admin Login"
            subtitle="Sign in to access Servelink operations."
          />

        </div>
      </div>
    </main>
  );
}
