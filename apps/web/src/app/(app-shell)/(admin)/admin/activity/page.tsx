"use client";

import { AdminActivityFeed } from "@/components/admin/activity/AdminActivityFeed";

export default function AdminActivityPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin activity</h1>
          <p className="max-w-3xl text-sm text-white/70">
            What just happened? A consolidated, newest-first feed of admin actions with quick paths
            into booking command center when a row is linked.
          </p>
        </div>
        <AdminActivityFeed />
      </div>
    </main>
  );
}
