import { Suspense } from "react";
import { RoleLoginPage } from "@/components/auth/RoleLoginPage";

export default function FoAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">
          Loading…
        </div>
      }
    >
      <RoleLoginPage
        expectedRole="fo"
        title="Franchise owner sign in"
        description="Sign in to open your work queue and assigned jobs. Your session is saved for this browser so dashboard pages can load securely."
        defaultNextPath="/fo"
      />
    </Suspense>
  );
}
