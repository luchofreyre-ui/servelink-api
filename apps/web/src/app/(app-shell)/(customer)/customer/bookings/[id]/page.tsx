"use client";

import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { CustomerBookingDetailPageContent } from "./CustomerBookingDetailPageClient";

export default function CustomerBookingDetailPage() {
  return (
    <AuthRoleGate role="customer">
      <CustomerBookingDetailPageContent />
    </AuthRoleGate>
  );
}
