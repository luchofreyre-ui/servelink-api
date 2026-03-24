import { Suspense } from "react";
import { RoleLoginPage } from "@/components/auth/RoleLoginPage";

export default function CustomerAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">
          Loading…
        </div>
      }
    >
      <RoleLoginPage
        expectedRole="customer"
        title="Customer sign in"
        description="Sign in to view your bookings and service updates. Your session is saved for this browser so dashboard pages can load securely."
        defaultNextPath="/customer"
      />
    </Suspense>
  );
}
