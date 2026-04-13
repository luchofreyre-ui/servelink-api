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
    <div className="min-h-screen bg-[#FFF9F3] px-6 py-24 text-center font-[var(--font-manrope)] text-[#475569]">
      Loading confirmation…
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
