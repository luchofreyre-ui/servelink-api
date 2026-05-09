import { describe, expect, it } from "vitest";
import type { BookingRecord } from "./bookingApiTypes";
import {
  displayBookingNotesLines,
  displayCustomerSafeBookingNotesLines,
  displayOpsBookingNotesLines,
  extractCustomerTeamPrepFromBookingNotes,
  extractTeamPrepFromBookingNotes,
} from "./bookingDisplay";

describe("customer booking notes display helpers", () => {
  it("extracts customerPrep from intake-bridge line without exposing serviceId", () => {
    const raw =
      "Booking direction intake in_abc | serviceId=deep_clean | frequency=Weekly | preferredTime=morning | customerPrep=Side gate — parking on street";
    expect(extractCustomerTeamPrepFromBookingNotes(raw)).toBe(
      "Side gate — parking on street",
    );
  });

  it("returns null when customerPrep absent", () => {
    const raw =
      "Booking direction intake in_abc | serviceId=deep_clean | frequency=Weekly | preferredTime=morning";
    expect(extractCustomerTeamPrepFromBookingNotes(raw)).toBeNull();
  });

  it("hides intake-bridge lines from customer-safe timeline", () => {
    const raw =
      "Booking direction intake in_abc | serviceId=x | frequency=Weekly | preferredTime=m | customerPrep=Note A";
    expect(displayCustomerSafeBookingNotesLines(raw)).toEqual([]);
  });

  it("keeps non-bridge note lines for the customer timeline", () => {
    const raw =
      "Booking direction intake in_1 | serviceId=x | frequency=w | preferredTime=m\nCalled customer to confirm time window.";
    expect(displayCustomerSafeBookingNotesLines(raw)).toEqual([
      "Called customer to confirm time window.",
    ]);
  });

  it("displayOpsBookingNotesLines mirrors customer-safe filtering for ops timelines", () => {
    const bridgeOnly =
      "Booking direction intake in_abc | serviceId=x | frequency=Weekly | preferredTime=m | customerPrep=Hidden";
    expect(displayOpsBookingNotesLines(bridgeOnly)).toEqual([]);

    const mixed =
      "Booking direction intake in_1 | serviceId=x | frequency=w | preferredTime=m\nFO confirmed arrival window.";
    expect(displayOpsBookingNotesLines(mixed)).toEqual(["FO confirmed arrival window."]);
  });

  it("extractTeamPrepFromBookingNotes matches extractCustomerTeamPrepFromBookingNotes", () => {
    const raw =
      "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m | customerPrep=Back door";
    expect(extractTeamPrepFromBookingNotes(raw)).toBe(
      extractCustomerTeamPrepFromBookingNotes(raw),
    );
  });

  it("displayBookingNotesLines returns raw lines including intake bridge for legacy/debug callers", () => {
    const bridge =
      "Booking direction intake in_1 | serviceId=x | frequency=w | preferredTime=m";
    const booking = { notes: bridge } as BookingRecord;
    expect(displayBookingNotesLines(booking)).toEqual([bridge]);
  });
});