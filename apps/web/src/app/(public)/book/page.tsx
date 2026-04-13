import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlowClient } from "@/components/marketing/precision-luxury/booking/BookingFlowClient";
import { buildBookingPageMetadata } from "@/components/marketing/precision-luxury/content/publicContentMetadata";

export const metadata: Metadata = buildBookingPageMetadata();

export default function BookingFlowRoute() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#FFF9F3] p-8 text-sm text-slate-600">Loading…</div>}>
      <BookingFlowClient />
    </Suspense>
  );
}
