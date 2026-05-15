import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlowClient } from "@/components/marketing/precision-luxury/booking/BookingFlowClient";
import { buildBookingPageMetadata } from "@/components/marketing/precision-luxury/content/publicContentMetadata";

export const metadata: Metadata = buildBookingPageMetadata();

export default function BookingFlowRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center bg-[#FFF9F3] px-6 py-16 text-center">
          <p className="font-[var(--font-manrope)] text-sm font-medium text-[#475569]">
            Preparing your booking experience…
          </p>
          <p className="mt-2 max-w-sm font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
            Nu Standard — just a moment while we open the next screen.
          </p>
        </div>
      }
    >
      <BookingFlowClient />
    </Suspense>
  );
}
