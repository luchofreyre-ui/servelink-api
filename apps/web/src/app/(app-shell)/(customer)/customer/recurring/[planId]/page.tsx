"use client";

import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { RecurringPlanDetailClient } from "@/components/customer/recurring/RecurringPlanDetailClient";

export default function CustomerRecurringPlanDetailPage() {
  return (
    <AuthRoleGate role="customer">
      <RecurringPlanDetailClient />
    </AuthRoleGate>
  );
}
