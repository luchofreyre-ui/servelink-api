import { afterEach, describe, expect, it } from "vitest";
import {
  BOOKING_CONFIRMATION_SESSION_KEY,
  BOOKING_FLOW_FRESH_START_FLAG,
  BOOKING_URL_APPLIANCE_PRESENCE,
  BOOKING_URL_DEEP_CLEAN_FOCUS,
  BOOKING_URL_TRANSITION_STATE,
  applyContactFieldChangeToBookingFlowState,
  applyHomeDetailsFieldChangeToBookingFlowState,
  applyScheduleFieldChangeToBookingFlowState,
  applyServiceChangeToBookingFlowState,
  buildBookingSearchParams,
  clampBookingStepToStructuralMax,
  consumeBookingFlowFreshStartRequested,
  hasPublicIntakeEchoInSearchParams,
  markBookingFlowFreshStartRequested,
  mergeConfirmationParamsFromSessionIfUrlEmpty,
  buildPublicServiceLocationPayload,
  BOOKING_URL_HOME_ADDONS,
  BOOKING_URL_HOME_SCOPE,
  normalizeBookingAddOnsForPayload,
  normalizeBookingHomeSizeParam,
  parseBookingSearchParams,
  type BookingConfirmationSessionSnapshotV1,
} from "./bookingUrlState";
import { defaultBookingFlowState } from "./bookingFlowData";
import type { BookingFlowState } from "./bookingFlowTypes";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import { bookingServiceCatalog } from "./bookingServiceCatalog";
import { isBookingMoveTransitionServiceId } from "./bookingDeepClean";

function catalogDeepAndShallow(): {
  deepId: string;
  shallowId: string;
} {
  const deep = bookingServiceCatalog.find((x) =>
    isDeepCleaningBookingServiceId(x.id),
  );
  const shallow = bookingServiceCatalog.find((x) =>
    isBookingMoveTransitionServiceId(x.id),
  );
  if (!deep || !shallow) {
    throw new Error("expected catalog to include deep clean and move transition");
  }
  return { deepId: deep.id, shallowId: shallow.id };
}

describe("bookingUrlState", () => {
  afterEach(() => {
    sessionStorage.removeItem(BOOKING_FLOW_FRESH_START_FLAG);
    sessionStorage.removeItem(BOOKING_CONFIRMATION_SESSION_KEY);
  });

  it("marks and consumes booking fresh-start flag once", () => {
    expect(consumeBookingFlowFreshStartRequested()).toBe(false);
    markBookingFlowFreshStartRequested();
    expect(sessionStorage.getItem(BOOKING_FLOW_FRESH_START_FLAG)).toBe("1");
    expect(consumeBookingFlowFreshStartRequested()).toBe(true);
    expect(sessionStorage.getItem(BOOKING_FLOW_FRESH_START_FLAG)).toBeNull();
    expect(consumeBookingFlowFreshStartRequested()).toBe(false);
  });

  it("normalizes home size commas consistently with preview intake", () => {
    expect(normalizeBookingHomeSizeParam(" 2,200 ")).toBe("2200");
  });

  it("cold /book entry keeps the default service step", () => {
    const s = parseBookingSearchParams(new URLSearchParams());
    expect(s.step).toBe(defaultBookingFlowState.step);
  });

  it("applyServiceChangeToBookingFlowState clears deep-clean program when leaving deep clean and preserves home, schedule, contact", () => {
    const { deepId, shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "service",
      serviceId: deepId,
      deepCleanProgram: "phased_3_visit",
      deepCleanFocus: "kitchen_bath_priority",
      homeSize: "3000",
      bedrooms: "4",
      bathrooms: "3",
      pets: "Two dogs",
      scopeIntensity: "targeted_touch_up",
      selectedAddOns: ["cabinets_detail", "inside_oven"],
      frequency: "Bi-Weekly",
      preferredTime: "Friday",
      customerName: "Pat",
      customerEmail: "pat@example.com",
    };
    const next = applyServiceChangeToBookingFlowState(prev, shallowId);
    expect(next.serviceId).toBe(shallowId);
    expect(next.deepCleanProgram).toBe("");
    expect(next.homeSize).toBe("3000");
    expect(next.bedrooms).toBe("4");
    expect(next.bathrooms).toBe("3");
    expect(next.pets).toBe("Two dogs");
    expect(next.frequency).toBe("Bi-Weekly");
    expect(next.preferredTime).toBe("Friday");
    expect(next.customerName).toBe("Pat");
    expect(next.customerEmail).toBe("pat@example.com");
    expect(next.scopeIntensity).toBe("targeted_touch_up");
    expect(next.selectedAddOns).toEqual(["cabinets_detail", "inside_oven"]);
    expect(next.deepCleanFocus).toBe(defaultBookingFlowState.deepCleanFocus);
    expect(next.transitionState).toBe(defaultBookingFlowState.transitionState);
    expect(next.appliancePresence).toEqual([]);
    expect(next.bookingPublicPath).toBe("move_transition");
  });

  it("applyServiceChangeToBookingFlowState defaults deep program when entering deep clean without a stored choice", () => {
    const { deepId, shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "service",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Weekly",
      preferredTime: "Saturday",
      customerName: "",
      customerEmail: "",
    };
    const next = applyServiceChangeToBookingFlowState(prev, deepId);
    expect(next.serviceId).toBe(deepId);
    expect(next.deepCleanProgram).toBe("single_visit");
    expect(next.frequency).toBe("Weekly");
    expect(next.preferredTime).toBe("Saturday");
    expect(next.bookingPublicPath).toBe("one_time_cleaning");
  });

  it("applyServiceChangeToBookingFlowState preserves phased program when staying on deep clean", () => {
    const { deepId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "service",
      serviceId: deepId,
      deepCleanProgram: "phased_3_visit",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Friday",
      customerName: "",
      customerEmail: "",
    };
    const next = applyServiceChangeToBookingFlowState(prev, deepId);
    expect(next.deepCleanProgram).toBe("phased_3_visit");
    expect(next.bookingPublicPath).toBe("one_time_cleaning");
  });

  it("applyHomeDetailsFieldChangeToBookingFlowState only touches home fields and preserves service, schedule, contact", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "home",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Weekly",
      preferredTime: "Friday",
      customerName: "Rae",
      customerEmail: "rae@example.com",
    };
    const next = applyHomeDetailsFieldChangeToBookingFlowState(prev, {
      homeSize: "2500",
    });
    expect(next.homeSize).toBe("2500");
    expect(next.bedrooms).toBe("2");
    expect(next.frequency).toBe("Weekly");
    expect(next.preferredTime).toBe("Friday");
    expect(next.serviceId).toBe(shallowId);
    expect(next.customerEmail).toBe("rae@example.com");
  });

  it("applyHomeDetailsFieldChangeToBookingFlowState with empty homeSize plus clamp demotes review to home", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "review",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Weekly",
      preferredTime: "Friday",
      serviceLocationZip: "94103",
      customerName: "x",
      customerEmail: "x@y.co",
    };
    const patched = applyHomeDetailsFieldChangeToBookingFlowState(prev, {
      homeSize: "",
    });
    const clamped = clampBookingStepToStructuralMax(patched);
    expect(clamped.step).toBe("home");
    expect(clamped.frequency).toBe("Weekly");
    expect(clamped.preferredTime).toBe("Friday");
  });

  it("applyHomeDetailsFieldChangeToBookingFlowState pets change leaves schedule intact", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "home",
      serviceId: shallowId,
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Monthly",
      preferredTime: "Saturday",
      customerName: "",
      customerEmail: "",
    };
    const next = applyHomeDetailsFieldChangeToBookingFlowState(prev, {
      pets: "One dog",
    });
    expect(next.pets).toBe("One dog");
    expect(next.frequency).toBe("Monthly");
    expect(next.preferredTime).toBe("Saturday");
  });

  it("applyHomeDetailsFieldChangeToBookingFlowState sorts problemAreas and dedupes", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "home",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Weekly",
      preferredTime: "Friday",
      customerName: "",
      customerEmail: "",
    };
    const next = applyHomeDetailsFieldChangeToBookingFlowState(prev, {
      problemAreas: ["pet_hair", "kitchen_grease", "pet_hair"],
    });
    expect(next.problemAreas).toEqual(["kitchen_grease", "pet_hair"]);
  });

  it("applyHomeDetailsFieldChangeToBookingFlowState sorts selectedAddOns and dedupes", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "home",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Weekly",
      preferredTime: "Friday",
      customerName: "",
      customerEmail: "",
    };
    const next = applyHomeDetailsFieldChangeToBookingFlowState(prev, {
      selectedAddOns: ["inside_oven", "inside_fridge", "inside_oven", "fake_token" as never],
    });
    expect(next.selectedAddOns).toEqual(["inside_fridge", "inside_oven"]);
  });

  it("parseBookingSearchParams reads estimator depth URL keys; buildBookingSearchParams round-trips non-defaults", () => {
    const { shallowId } = catalogDeepAndShallow();
    const sp = new URLSearchParams(
      `step=home&service=${encodeURIComponent(shallowId)}&homeSize=2000&bedrooms=2&bathrooms=2&homeCondition=light_upkeep&homeProblems=kitchen_grease,pet_hair,not_a_real_token&homeSurface=dense_layout&homeScope=detail_heavy&homeAddOns=inside_oven,inside_fridge,bad_addon&frequency=Weekly&preferredTime=Friday`,
    );
    const parsed = parseBookingSearchParams(sp);
    expect(parsed.condition).toBe("light_upkeep");
    expect(parsed.problemAreas).toEqual(["kitchen_grease", "pet_hair"]);
    expect(parsed.surfaceComplexity).toBe("dense_layout");
    expect(parsed.scopeIntensity).toBe("detail_heavy");
    expect(parsed.selectedAddOns).toEqual(["inside_fridge", "inside_oven"]);
    const out = buildBookingSearchParams(parsed);
    expect(out.get("homeCondition")).toBe("light_upkeep");
    expect(out.get("homeProblems")).toBe("kitchen_grease,pet_hair");
    expect(out.get("homeSurface")).toBe("dense_layout");
    expect(out.get(BOOKING_URL_HOME_SCOPE)).toBe("detail_heavy");
    expect(out.get(BOOKING_URL_HOME_ADDONS)).toBe("inside_fridge,inside_oven");
  });

  it("normalizeBookingAddOnsForPayload drops unknown tokens", () => {
    expect(
      normalizeBookingAddOnsForPayload([
        "inside_fridge",
        "not_real" as never,
        "interior_windows",
      ]),
    ).toEqual(["inside_fridge", "interior_windows"]);
  });

  it("applyHomeDetailsFieldChangeToBookingFlowState sorts appliancePresence and dedupes", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "home",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Weekly",
      preferredTime: "Friday",
      customerName: "",
      customerEmail: "",
    };
    const next = applyHomeDetailsFieldChangeToBookingFlowState(prev, {
      appliancePresence: [
        "washer_dryer_present",
        "refrigerator_present",
        "washer_dryer_present",
        "fake" as never,
      ],
    });
    expect(next.appliancePresence).toEqual([
      "refrigerator_present",
      "washer_dryer_present",
    ]);
  });

  it("parse/build round-trips move service transition + appliances; drops unknown appliance tokens", () => {
    const moveId = bookingServiceCatalog.find((s) => s.slug === "move-in-move-out")?.id;
    if (!moveId || !isBookingMoveTransitionServiceId(moveId)) {
      throw new Error("expected move-in-move-out in booking catalog");
    }
    const sp = new URLSearchParams(
      `step=home&service=${encodeURIComponent(moveId)}&homeSize=2000&bedrooms=2&bathrooms=2&frequency=Weekly&preferredTime=Friday&mvSetup=fully_furnished&mvAppliances=oven_present,refrigerator_present,bad_appliance`,
    );
    const parsed = parseBookingSearchParams(sp);
    expect(parsed.transitionState).toBe("fully_furnished");
    expect(parsed.appliancePresence).toEqual(["oven_present", "refrigerator_present"]);
    const out = buildBookingSearchParams(parsed);
    expect(out.get(BOOKING_URL_TRANSITION_STATE)).toBe("fully_furnished");
    expect(out.get(BOOKING_URL_APPLIANCE_PRESENCE)).toBe(
      "oven_present,refrigerator_present",
    );
  });

  it("parse/build round-trips deep-clean focus only for deep service URL", () => {
    const { deepId } = catalogDeepAndShallow();
    const sp = new URLSearchParams(
      `step=home&service=${encodeURIComponent(deepId)}&homeSize=2000&bedrooms=2&bathrooms=2&frequency=Weekly&preferredTime=Friday&dcProgram=single_visit&dcFocus=high_touch_detail`,
    );
    const parsed = parseBookingSearchParams(sp);
    expect(parsed.deepCleanFocus).toBe("high_touch_detail");
    const out = buildBookingSearchParams(parsed);
    expect(out.get(BOOKING_URL_DEEP_CLEAN_FOCUS)).toBe("high_touch_detail");
  });

  it("applyContactFieldChangeToBookingFlowState only touches contact fields and preserves booking shape", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "review",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "Cat",
      frequency: "Weekly",
      preferredTime: "Friday",
      customerName: "Alex",
      customerEmail: "alex@example.com",
    };
    const next = applyContactFieldChangeToBookingFlowState(prev, {
      customerName: "Jordan",
    });
    expect(next.customerName).toBe("Jordan");
    expect(next.customerEmail).toBe("alex@example.com");
    expect(next.homeSize).toBe("2000");
    expect(next.frequency).toBe("Weekly");
    expect(next.preferredTime).toBe("Friday");
    expect(next.serviceId).toBe(shallowId);
    expect(next.pets).toBe("Cat");
  });

  it("applyContactFieldChangeToBookingFlowState plus clamp preserves review when structure is complete", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "review",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Weekly",
      preferredTime: "Friday",
      serviceLocationZip: "94103",
      serviceLocationStreet: "100 Market St",
      serviceLocationCity: "San Francisco",
      serviceLocationState: "CA",
      serviceLocationUnit: "",
      serviceLocationAddressLine: "",
      customerName: "Pat",
      customerEmail: "pat@example.com",
    };
    const patched = applyContactFieldChangeToBookingFlowState(prev, {
      customerName: "",
      customerEmail: "",
    });
    const clamped = clampBookingStepToStructuralMax(patched);
    expect(clamped.step).toBe("review");
    expect(clamped.frequency).toBe("Weekly");
    expect(clamped.homeSize).toBe("2000");
  });

  it("applyScheduleFieldChangeToBookingFlowState only touches frequency and preferredTime", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "schedule",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "3200",
      bedrooms: "3",
      bathrooms: "2",
      pets: "Bird",
      frequency: "Weekly",
      preferredTime: "Friday",
      customerName: "Sam",
      customerEmail: "sam@example.com",
    };
    const next = applyScheduleFieldChangeToBookingFlowState(prev, {
      frequency: "Bi-Weekly",
    });
    expect(next.frequency).toBe("Bi-Weekly");
    expect(next.preferredTime).toBe("Friday");
    expect(next.homeSize).toBe("3200");
    expect(next.serviceId).toBe(shallowId);
    expect(next.customerEmail).toBe("sam@example.com");
  });

  it("clearing preferredTime preserves review in the public flow", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "review",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Weekly",
      preferredTime: "Friday",
      serviceLocationZip: "94103",
      serviceLocationStreet: "100 Market St",
      serviceLocationCity: "San Francisco",
      serviceLocationState: "CA",
      serviceLocationUnit: "",
      serviceLocationAddressLine: "",
      customerName: "x",
      customerEmail: "x@y.co",
    };
    const patched = applyScheduleFieldChangeToBookingFlowState(prev, {
      preferredTime: "",
    });
    const clamped = clampBookingStepToStructuralMax(patched);
    expect(clamped.step).toBe("review");
    expect(clamped.homeSize).toBe("2000");
    expect(clamped.frequency).toBe("One-Time");
  });

  it("clamp after applyServiceChange demotes to location because address is reset", () => {
    const { shallowId } = catalogDeepAndShallow();
    const prev: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "review",
      serviceId: shallowId,
      deepCleanProgram: "",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      pets: "",
      frequency: "Weekly",
      preferredTime: "Friday",
      serviceLocationZip: "94103",
      serviceLocationStreet: "10 Main",
      serviceLocationCity: "SF",
      serviceLocationState: "CA",
      serviceLocationUnit: "",
      serviceLocationAddressLine: "",
      customerName: "Jamie",
      customerEmail: "jamie@example.com",
    };
    const next = clampBookingStepToStructuralMax(
      applyServiceChangeToBookingFlowState(prev, shallowId),
    );
    expect(next.step).toBe("location");
  });

  it("parseBookingSearchParams does not read confirmation session snapshot", () => {
    sessionStorage.setItem(
      BOOKING_CONFIRMATION_SESSION_KEY,
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        intakeId: "in_from_session_only",
        bookingId: "bk_from_session_only",
        priceCents: 12345,
        durationMinutes: 90,
        confidence: 0.9,
        bookingErrorCode: "",
      }),
    );
    const s = parseBookingSearchParams(new URLSearchParams());
    expect(s.step).toBe(defaultBookingFlowState.step);
    expect(s.customerName).toBe("");
    expect(s.customerEmail).toBe("");
  });

  it("clamps an over-advanced step to home when prerequisites are missing", () => {
    const s = parseBookingSearchParams(
      new URLSearchParams("step=review&frequency=Weekly&preferredTime=Friday"),
    );
    expect(s.step).toBe("home");
  });

  it("shaped URL without step lands on review when home and location are complete", () => {
    const s = parseBookingSearchParams(
      new URLSearchParams(
        "homeSize=2000&bedrooms=2&bathrooms=2&frequency=Weekly&preferredTime=Friday&locZip=94103&locStreet=100%20Market%20St&locCity=San%20Francisco&locState=CA",
      ),
    );
    expect(s.step).toBe("review");
  });

  it("parse/build round-trips bookingId and intakeId while scheduling context is present", () => {
    const { shallowId } = catalogDeepAndShallow();
    const sp = new URLSearchParams(
      `step=schedule&service=${encodeURIComponent(shallowId)}&homeSize=2000&bedrooms=2&bathrooms=2&frequency=Weekly&preferredTime=Friday&locZip=94103&locStreet=100%20Market%20St&locCity=San%20Francisco&locState=CA&bookingId=bk_xyz&intakeId=in_abc`,
    );
    const parsed = parseBookingSearchParams(sp);
    expect(parsed.step).toBe("schedule");
    expect(parsed.schedulingBookingId).toBe("bk_xyz");
    expect(parsed.schedulingIntakeId).toBe("in_abc");
    const out = buildBookingSearchParams(parsed);
    expect(out.get("bookingId")).toBe("bk_xyz");
    expect(out.get("intakeId")).toBe("in_abc");
  });

  it("detects echoed intake params for confirmation", () => {
    expect(
      hasPublicIntakeEchoInSearchParams(new URLSearchParams("homeSize=1")),
    ).toBe(true);
    expect(hasPublicIntakeEchoInSearchParams(new URLSearchParams())).toBe(
      false,
    );
  });

  it("clampBookingStepToStructuralMax demotes review to location when street address is missing", () => {
    const s: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "review",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "",
      serviceLocationZip: "94103",
      serviceLocationStreet: "",
      serviceLocationCity: "San Francisco",
      serviceLocationState: "CA",
      serviceLocationUnit: "",
      serviceLocationAddressLine: "",
    };
    expect(clampBookingStepToStructuralMax(s).step).toBe("location");
  });

  it("clampBookingStepToStructuralMax demotes review to home when home is incomplete", () => {
    const s: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "review",
      homeSize: "",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Friday",
      serviceLocationZip: "94103",
      serviceLocationStreet: "10 Main",
      serviceLocationCity: "SF",
      serviceLocationState: "CA",
      serviceLocationUnit: "",
      serviceLocationAddressLine: "",
    };
    expect(clampBookingStepToStructuralMax(s).step).toBe("home");
  });

  it("clampBookingStepToStructuralMax demotes review to location when ZIP is missing", () => {
    const s: BookingFlowState = {
      ...defaultBookingFlowState,
      step: "review",
      homeSize: "2000",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Friday",
      serviceLocationZip: "",
      serviceLocationStreet: "10 Main",
      serviceLocationCity: "SF",
      serviceLocationState: "CA",
      serviceLocationUnit: "",
      serviceLocationAddressLine: "",
    };
    expect(clampBookingStepToStructuralMax(s).step).toBe("location");
  });

  it("mergeConfirmationParamsFromSessionIfUrlEmpty keeps URL when it has keys", () => {
    const session: BookingConfirmationSessionSnapshotV1 = {
      v: 1,
      savedAt: Date.now(),
      intakeId: "from_session",
      bookingId: "",
      priceCents: null,
      durationMinutes: null,
      confidence: null,
      bookingErrorCode: "",
    };
    const merged = mergeConfirmationParamsFromSessionIfUrlEmpty(
      new URLSearchParams("intakeId=from_url"),
      session,
    );
    expect(merged.get("intakeId")).toBe("from_url");
  });

  it("mergeConfirmationParamsFromSessionIfUrlEmpty replays session when URL is empty", () => {
    const session: BookingConfirmationSessionSnapshotV1 = {
      v: 1,
      savedAt: Date.now(),
      intakeId: "in_1",
      bookingId: "bk_1",
      priceCents: 100,
      durationMinutes: 60,
      confidence: 0.5,
      bookingErrorCode: "",
    };
    const merged = mergeConfirmationParamsFromSessionIfUrlEmpty(
      new URLSearchParams(),
      session,
    );
    expect(merged.get("intakeId")).toBe("in_1");
    expect(merged.get("bookingId")).toBe("bk_1");
    expect(merged.get("priceCents")).toBe("100");
  });

  it("buildPublicServiceLocationPayload returns API payload when location is complete", () => {
    const sp = new URLSearchParams(
      "locZip=94103&locStreet=100%20Market%20St&locCity=San%20Francisco&locState=CA",
    );
    const parsed = parseBookingSearchParams(sp);
    const payload = buildPublicServiceLocationPayload(parsed);
    expect(payload).toEqual({
      street: "100 Market St",
      city: "San Francisco",
      state: "CA",
      zip: "94103",
    });
  });

  it("allows review without legacy intent when home and structured service location are complete", () => {
    const s = parseBookingSearchParams(
      new URLSearchParams(
        "step=review&homeSize=2000&bedrooms=2&bathrooms=2&locZip=94103&locStreet=100%20Market%20St&locCity=San%20Francisco&locState=CA",
      ),
    );
    expect(s.intent).toBeUndefined();
    expect(s.step).toBe("review");
  });

  it("clamps stale review URLs with incomplete structured location back to location", () => {
    const s = parseBookingSearchParams(
      new URLSearchParams(
        "step=review&homeSize=2000&bedrooms=2&bathrooms=2&locZip=94103&locStreet=100%20Market%20St",
      ),
    );
    expect(s.step).toBe("location");
  });

  it("does not treat legacy locAddr alone as enough for review readiness", () => {
    const s = parseBookingSearchParams(
      new URLSearchParams(
        "step=review&homeSize=2000&bedrooms=2&bathrooms=2&locZip=94103&locAddr=100%20Market%20St",
      ),
    );
    expect(s.step).toBe("location");
  });
});
