import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const CUSTOMER_BOOKING_DETAIL_SOURCES_REL = [
  "src/components/booking-detail/customer/CustomerBookingDetail.tsx",
  "src/components/booking-detail/customer/CustomerBookingEducationBlock.tsx",
  "src/components/booking-detail/shared/DeepCleanExecutionReadOnlyPanel.tsx",
  "src/app/(app-shell)/(customer)/customer/bookings/[id]/page.tsx",
  "src/components/operations/customer/CustomerActiveBookingCard.tsx",
  "src/components/operations/customer/CustomerBookingUpdatesPanel.tsx",
  "src/components/bookings/RecurringPlanConversionCard.tsx",
  "src/components/dashboard/customer/CustomerDashboard.tsx",
  "src/components/marketing/precision-luxury/booking/BookingConfirmationClient.tsx",
  "src/components/marketing/precision-luxury/booking/BookingStepReview.tsx",
];

function readSource(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

describe("customer booking detail surfaces — static copy guard", () => {
  it("does not use legacy “How sure we are” heading copy", () => {
    for (const rel of CUSTOMER_BOOKING_DETAIL_SOURCES_REL) {
      const text = readSource(rel);
      expect(text, rel).not.toMatch(/How sure we are/i);
    }
  });

  it("does not frame recurring conversion with Savings / Discount marketing words", () => {
    for (const rel of [
      "src/components/bookings/RecurringPlanConversionCard.tsx",
      "src/components/marketing/precision-luxury/booking/BookingStepReview.tsx",
    ]) {
      const text = readSource(rel);
      expect(text, rel).not.toMatch(/\bSavings\b/i);
      expect(text, rel).not.toMatch(/\bDiscount\b/i);
    }
  });
});
