import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingConfirmationClient } from "@/components/marketing/precision-luxury/booking/BookingConfirmationClient";

export const metadata: Metadata = {
  title: "Booking received | Servelink",
  description:
    "Your booking request was received. Review your estimate summary and next steps.",
};

function ConfirmationFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFF9F3] px-6 py-24 text-center">
      <p className="font-[var(--font-manrope)] text-sm font-medium text-[#475569]">
        Loading your confirmation…
      </p>
      <p className="mt-2 max-w-xs font-[var(--font-manrope)] text-xs text-[#64748B]">
        Almost there.
      </p>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<ConfirmationFallback />}>
      <BookingConfirmationClient />
    </Suspense>
  );
}
