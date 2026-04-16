"use client";

import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { RecurringPlansPageClient } from "@/components/customer/recurring/RecurringPlansPageClient";

export default function CustomerRecurringPlansPage() {
  return (
    <AuthRoleGate role="customer">
      <RecurringPlansPageClient />
    </AuthRoleGate>
  );
}
