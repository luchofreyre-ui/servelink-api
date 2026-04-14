import type { Metadata } from "next";
import { Fragment, Suspense } from "react";
import { BookingFlowClient } from "@/components/marketing/precision-luxury/booking/BookingFlowClient";
import { buildBookingPageMetadata } from "@/components/marketing/precision-luxury/content/publicContentMetadata";

export const metadata: Metadata = buildBookingPageMetadata();

export default function BookingFlowRoute() {
  console.log("BOOK FLOW VERSION: NEW_FLOW_V1");
  return (
    <Fragment>
      <div className="bg-red-600 p-2 text-center text-sm text-white">
        BOOK FLOW VERSION: NEW_FLOW_V1
      </div>
      <Suspense fallback={<div className="min-h-[40vh] bg-[#FFF9F3] p-8 text-sm text-slate-600">Loading…</div>}>
        <BookingFlowClient />
      </Suspense>
    </Fragment>
  );
}
