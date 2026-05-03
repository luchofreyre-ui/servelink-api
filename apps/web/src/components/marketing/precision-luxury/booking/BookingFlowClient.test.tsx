import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOOKING_ADD_ON_LABELS,
  BOOKING_APPLIANCE_PRESENCE_LABELS,
  BOOKING_PUBLIC_CARD_FIRST_TIME_WITH_RECURRING_TITLE,
  BOOKING_PUBLIC_CARD_MOVE_TITLE,
  BOOKING_PUBLIC_CARD_ONE_TIME_TITLE,
  BOOKING_PUBLIC_CARD_RECURRING_TITLE,
  BOOKING_PUBLIC_SERVICE_SECTION_TITLE,
  BOOKING_RECURRING_GATE_LOGIN_CTA,
  BOOKING_RECURRING_GATE_REGISTER_CTA,
  BOOKING_SERVICE_STEP_RECURRING_CONTINUE_BLOCKED,
  BOOKING_DEEP_CLEAN_FOCUS_LABELS,
  BOOKING_REVIEW_DEEP_CLEAN_FOCUS_LABEL,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_ADD_ONS,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DENSE_LAYOUT,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DEEP_CLEAN_FOCUS,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DETAIL_HEAVY_SCOPE,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_FURNISHED_TRANSITION,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_HEAVY_CONDITION,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_PROBLEM_AREAS,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_TRANSITION_APPLIANCES,
  BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE,
  BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_LEAD,
  BOOKING_REVIEW_PRE_CONF_CUSTOM_HEADLINE,
  BOOKING_REVIEW_PRE_CONF_HIGH_HEADLINE,
  BOOKING_REVIEW_PRE_CONF_HIGH_SUPPORTING,
  BOOKING_REVIEW_PRE_CONF_SPECIAL_HEADLINE,
  BOOKING_REVIEW_PREP_DENSE_LAYOUT,
  BOOKING_REVIEW_PREP_FRIDGE,
  BOOKING_REVIEW_PREP_MOVE_FURNISHED,
  BOOKING_REVIEW_PREP_OVEN,
  BOOKING_REVIEW_PREP_PETS,
  BOOKING_REVIEW_REC_BASEBOARDS_DETAIL,
  BOOKING_REVIEW_REC_CABINETS_DETAIL,
  BOOKING_REVIEW_REC_INSIDE_FRIDGE,
  BOOKING_REVIEW_REC_INSIDE_OVEN,
  BOOKING_REVIEW_REC_INTERIOR_WINDOWS,
  BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD,
  BOOKING_REVIEW_SUBMIT_TRY_AGAIN,
  BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_REFRESHING,
  BOOKING_REVIEW_SEE_AVAILABLE_TEAMS_CTA,
  BOOKING_REVIEW_STEP_TITLE,
  BOOKING_REVIEW_TRANSITION_SETUP_LABEL,
  BOOKING_SCHEDULE_CHOOSE_SLOT_HINT,
  BOOKING_SCHEDULE_CHOOSE_TEAM_TITLE,
  BOOKING_SCHEDULE_CONFIRM_BOOKING_CTA,
  BOOKING_SCHEDULE_CONFIRM_FAILED,
  BOOKING_SCHEDULE_HOLD_FAILED,
  BOOKING_SCHEDULE_HOLD_FAILED_HINT,
  BOOKING_SCHEDULE_NO_SLOTS_FOR_TEAM_TITLE,
  BOOKING_SCHEDULE_SLOTS_TITLE,
  BOOKING_SCHEDULE_SUMMARY_TITLE,
  BOOKING_SCHEDULE_ZERO_TEAMS_TITLE,
  BOOKING_TRANSITION_STATE_LABELS,
  BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE,
  BOOKING_REVIEW_DEPOSIT_SCHEDULE_GATE_MESSAGE,
} from "./bookingPublicSurfaceCopy";
import { BOOKING_INTAKE_PREFERRED_TIME_DEFERRED } from "./bookingIntakePreferredTime";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import { BOOKING_BEDROOMS_FIELD_LABEL } from "./bookingEstimateFactorFields";
import {
  bookingServiceCatalog,
  getBookingDefaultServiceId,
} from "./bookingServiceCatalog";

const phase4ServiceIds = {
  deep: bookingServiceCatalog.find((s) => s.slug === "deep-cleaning")!.id,
  move: bookingServiceCatalog.find((s) => s.slug === "move-in-move-out")!.id,
};
const DEPOSIT_LOCK_KEY = "booking_deposit_in_flight";
import {
  BOOKING_CONFIRMATION_SESSION_KEY,
  BOOKING_FLOW_FRESH_START_FLAG,
  markBookingFlowFreshStartRequested,
} from "./bookingUrlState";
import { BookingFlowClient } from "./BookingFlowClient";
import { BookingStepSchedule } from "./BookingStepSchedule";
import { defaultBookingFlowState } from "./bookingFlowData";
import {
  PublicBookingApiError,
  PublicBookingPaymentRequiredError,
} from "./bookingDirectionIntakeApi";

const TEST_REVIEW_LOC_QUERY =
  "&locZip=94103&locStreet=100%20Market%20St&locCity=San%20Francisco&locState=CA";
const TEST_INTENT_QUERY = "&intent=RESET";

function fillReviewContactFast() {
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: "Alex Rivera" },
  });
  fireEvent.change(screen.getByLabelText(/^email$/i), {
    target: { value: "alex@example.com" },
  });
}

async function fillReviewContactAndOptionalFirstTimePlan(timeout = 8000) {
  fillReviewContactFast();
  await waitFor(() => {
    const one = screen.queryByTestId("booking-post-estimate-one_visit");
    if (one) fireEvent.click(one);
    expect(screen.getByTestId("booking-direction-send")).not.toBeDisabled();
  }, { timeout });
}

/** After home edits: advance location gate (ZIP) then review. */
async function continueThroughLocationGateToReview() {
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { level: 2, name: "Service location" }),
    ).toBeInTheDocument(),
  );
  fireEvent.change(screen.getByLabelText(/^street address$/i), {
    target: { value: "100 Market St" },
  });
  fireEvent.change(screen.getByLabelText(/^city$/i), {
    target: { value: "San Francisco" },
  });
  fireEvent.change(screen.getByLabelText(/^state$/i), {
    target: { value: "CA" },
  });
  const zipInput = screen.getByLabelText(/^ZIP code$/i) as HTMLInputElement;
  if (!zipInput.value || zipInput.value.replace(/\s/g, "").length < 5) {
    fireEvent.change(zipInput, { target: { value: "94103" } });
  }
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  await waitFor(() =>
    expect(screen.getByText(BOOKING_REVIEW_STEP_TITLE)).toBeInTheDocument(),
  );
}

const bookingFlowTestSearch = vi.hoisted(() => ({
  sp: new URLSearchParams(),
}));

const routerReplace = vi.fn();
const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/book",
  useRouter: () => ({
    replace: routerReplace,
    push: routerPush,
  }),
  useSearchParams: () => bookingFlowTestSearch.sp,
}));

const previewEstimateMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    kind: "booking_direction_estimate_preview",
    estimate: {
      priceCents: 50000,
      durationMinutes: 180,
      confidence: 0.85,
    },
    deepCleanProgram: null,
  }),
);

const submitBookingDirectionIntakeMock = vi.hoisted(() => vi.fn());

async function defaultPostPublicBookingAvailability(body: {
  bookingId: string;
  foId?: string;
}) {
  if (body.foId) {
    const isSouth = body.foId === "fo_second";
    const startAt = isSouth
      ? "2030-04-16T10:00:00.000Z"
      : "2030-04-15T14:00:00.000Z";
    const endAt = isSouth
      ? "2030-04-16T12:00:00.000Z"
      : "2030-04-15T16:00:00.000Z";
    return {
      kind: "public_booking_team_availability" as const,
      bookingId: body.bookingId,
      selectedTeam: {
        id: body.foId,
        displayName: isSouth ? "South Team" : "North Team",
      },
      windows: [
        {
          slotId: `server-slot:${body.foId}:${startAt}`,
          foId: body.foId,
          foDisplayName: isSouth ? "South Team" : "North Team",
          startAt,
          endAt,
          durationMinutes: 120,
        },
      ],
    };
  }
  return {
    kind: "public_booking_team_options" as const,
    bookingId: body.bookingId,
    teams: [
      {
        id: "fo_test_pick",
        displayName: "North Team",
        isRecommended: true,
      },
      {
        id: "fo_second",
        displayName: "South Team",
        isRecommended: false,
      },
    ],
    selectionRequired: true as const,
  };
}

const postPublicBookingAvailabilityMock = vi.hoisted(() =>
  vi.fn(defaultPostPublicBookingAvailability),
);

const postPublicBookingHoldMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    kind: "public_booking_hold" as const,
    bookingId: "bk_test",
    holdId: "hold_test",
    expiresAt: "2030-04-15T18:00:00.000Z",
    window: {
      foId: "fo_test_pick",
      startAt: "2030-04-15T14:00:00.000Z",
      endAt: "2030-04-15T16:00:00.000Z",
    },
  }),
);

const postPublicBookingConfirmMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    kind: "public_booking_confirmation" as const,
    bookingId: "bk_test",
    scheduledStart: "2030-04-15T14:00:00.000Z",
    scheduledEnd: "2030-04-15T16:00:00.000Z",
    status: "confirmed",
    alreadyApplied: false,
  }),
);

vi.mock("./bookingDirectionIntakeApi", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("./bookingDirectionIntakeApi")>();
  return {
    ...mod,
    previewEstimate: previewEstimateMock,
    submitBookingDirectionIntake: submitBookingDirectionIntakeMock,
    postPublicBookingAvailability: postPublicBookingAvailabilityMock,
    postPublicBookingHold: postPublicBookingHoldMock,
    postPublicBookingConfirm: postPublicBookingConfirmMock,
  };
});

const postPublicBookingDepositPrepareMock = vi.hoisted(() =>
  vi.fn(async (body: { bookingId: string }) => ({
    kind: "public_booking_deposit_prepare" as const,
    bookingId: body.bookingId,
    paymentMode: "none" as const,
    classification: "skip_deposit_env",
    nextAction: "finalize_booking" as const,
  })),
);

vi.mock("./bookingPaymentClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./bookingPaymentClient")>();
  return {
    ...mod,
    postPublicBookingDepositPrepare: postPublicBookingDepositPrepareMock,
  };
});

vi.mock("@/lib/stripe/stripeClient", () => ({
  getStripePromise: () =>
    Promise.resolve({} as import("@stripe/stripe-js").Stripe),
}));

vi.mock("./DepositPaymentElement", () => ({
  DepositPaymentElement: ({
    onSuccess,
    disabled,
  }: {
    onSuccess: () => void | Promise<void>;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      data-testid="deposit-mock-pay"
      disabled={Boolean(disabled)}
      onClick={() => void Promise.resolve(onSuccess())}
    >
      Pay deposit
    </button>
  ),
}));

const emitBookingFunnelEventMock = vi.hoisted(() => vi.fn());

vi.mock("./bookingFunnelAnalytics", () => ({
  emitBookingFunnelEvent: (...args: unknown[]) => emitBookingFunnelEventMock(...args),
}));

vi.mock("../layout/ServiceHeader", () => ({
  ServiceHeader: () => <div data-testid="mock-service-header" />,
}));
vi.mock("../layout/PublicSiteFooter", () => ({
  PublicSiteFooter: () => <div data-testid="mock-public-footer" />,
}));

function buildReviewSearchString(): string {
  const svc = getBookingDefaultServiceId();
  const dc = isDeepCleaningBookingServiceId(svc) ? "&dcProgram=single_visit" : "";
  return `step=review&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday${TEST_REVIEW_LOC_QUERY}${TEST_INTENT_QUERY}&service=${encodeURIComponent(
    svc,
  )}${dc}`;
}

function buildIncompleteHomeStepSearchString(): string {
  const svc = getBookingDefaultServiceId();
  const dc = isDeepCleaningBookingServiceId(svc) ? "&dcProgram=single_visit" : "";
  return `step=home&homeSize=&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday${TEST_INTENT_QUERY}&service=${encodeURIComponent(
    svc,
  )}${dc}`;
}

/** Home is structurally complete but cadence (frequency / preferred time) is missing. */
function buildIncompleteCadenceHomeSearchString(): string {
  const svc = getBookingDefaultServiceId();
  const dc = isDeepCleaningBookingServiceId(svc) ? "&dcProgram=single_visit" : "";
  return `step=home&homeSize=&bedrooms=2&bathrooms=2&pets=${TEST_INTENT_QUERY}&service=${encodeURIComponent(
    svc,
  )}${dc}`;
}

function buildReviewSearchStringForService(serviceId: string): string {
  const dc = isDeepCleaningBookingServiceId(serviceId)
    ? "&dcProgram=single_visit"
    : "";
  return `step=review&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday${TEST_REVIEW_LOC_QUERY}${TEST_INTENT_QUERY}&service=${encodeURIComponent(
    serviceId,
  )}${dc}`;
}

function goHomeFromReviewViaBackOnce() {
  fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
  if (
    screen.queryByRole("heading", {
      level: 2,
      name: "Service location",
    })
  ) {
    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
  }
}

async function submitFromReviewToSchedule() {
  submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
  await fillReviewContactAndOptionalFirstTimePlan();
  const send = await screen.findByTestId("booking-direction-send");
  fireEvent.click(send);
  await waitFor(() =>
    expect(screen.getByTestId("booking-schedule-team-section")).toBeInTheDocument(),
  );
}

async function chooseResetIntentAndContinue() {
  await waitFor(() =>
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "What brings you in today?",
      }),
    ).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByText("My place needs a real clean"));
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
}

async function selectNorthTeamAndFirstSlot() {
  fireEvent.click(screen.getByText("North Team"));
  const slotSection = await screen.findByTestId("booking-schedule-slot-section");
  const confirm = screen.getByTestId("booking-schedule-confirm-booking");
  const slotBtn = within(slotSection)
    .getAllByRole("button")
    .find((b) => b !== confirm)!;
  fireEvent.click(slotBtn);
  await waitFor(() => expect(confirm).not.toBeDisabled());
  return { confirm };
}

function reviewHomeDetailsSection() {
  const reviewRoot = screen
    .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
    .closest("section")!;
  return within(reviewRoot).getByText("Home details").closest("div.rounded-2xl")!;
}

const submitSuccess = {
  kind: "booking_direction_intake_submit" as const,
  intakeId: "in_test",
  bookingCreated: true,
  schedulable: true,
  bookingId: "bk_test",
  estimate: {
    priceCents: 50000,
    durationMinutes: 180,
    confidence: 0.85,
  },
  deepCleanProgram: null,
  bookingError: null,
};

describe("BookingFlowClient", () => {
  beforeEach(() => {
    bookingFlowTestSearch.sp = new URLSearchParams();
    routerReplace.mockClear();
    routerPush.mockClear();
    previewEstimateMock.mockClear();
    previewEstimateMock.mockResolvedValue({
      kind: "booking_direction_estimate_preview",
      estimate: {
        priceCents: 50000,
        durationMinutes: 180,
        confidence: 0.85,
      },
      deepCleanProgram: null,
    });
    submitBookingDirectionIntakeMock.mockReset();
    postPublicBookingDepositPrepareMock.mockReset();
    postPublicBookingDepositPrepareMock.mockImplementation(async (body: {
      bookingId: string;
    }) => ({
      kind: "public_booking_deposit_prepare",
      bookingId: body.bookingId,
      paymentMode: "none",
      classification: "skip_deposit_env",
      nextAction: "finalize_booking",
    }));
    postPublicBookingAvailabilityMock.mockClear();
    postPublicBookingHoldMock.mockClear();
    postPublicBookingConfirmMock.mockReset();
    postPublicBookingConfirmMock.mockResolvedValue({
      kind: "public_booking_confirmation" as const,
      bookingId: "bk_test",
      scheduledStart: "2030-04-15T14:00:00.000Z",
      scheduledEnd: "2030-04-15T16:00:00.000Z",
      status: "confirmed",
      alreadyApplied: false,
    });
    emitBookingFunnelEventMock.mockClear();
    sessionStorage.removeItem(BOOKING_CONFIRMATION_SESSION_KEY);
    sessionStorage.removeItem(BOOKING_FLOW_FRESH_START_FLAG);
    sessionStorage.removeItem(DEPOSIT_LOCK_KEY);
  });

  afterEach(() => {
    cleanup();
    sessionStorage.removeItem(BOOKING_CONFIRMATION_SESSION_KEY);
    sessionStorage.removeItem(BOOKING_FLOW_FRESH_START_FLAG);
    sessionStorage.removeItem(DEPOSIT_LOCK_KEY);
  });

  it("does not start a second submit while the first is still in flight", async () => {
    bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
    let release: (value: unknown) => void = () => {};
    submitBookingDirectionIntakeMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );

    render(<BookingFlowClient />);

    await fillReviewContactAndOptionalFirstTimePlan(5000);

    const send = screen.getByTestId("booking-direction-send");

    fireEvent.click(send);
    fireEvent.click(send);

    expect(submitBookingDirectionIntakeMock).toHaveBeenCalledTimes(1);

    release(submitSuccess);
    await waitFor(() =>
      expect(screen.getByTestId("booking-schedule-team-section")).toBeInTheDocument(),
    );
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("after saving from review, loads ranked team options for scheduling", async () => {
    bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
    submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
    render(<BookingFlowClient />);
    await submitFromReviewToSchedule();
    expect(postPublicBookingAvailabilityMock).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: "bk_test" }),
    );
    expect(screen.getByText("North Team")).toBeInTheDocument();
  });

  it("selecting a team requests team-specific availability", async () => {
    bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
    submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
    render(<BookingFlowClient />);
    await submitFromReviewToSchedule();
    postPublicBookingAvailabilityMock.mockClear();
    fireEvent.click(screen.getByText("North Team"));
    await waitFor(() =>
      expect(postPublicBookingAvailabilityMock).toHaveBeenCalledWith(
        expect.objectContaining({ bookingId: "bk_test", foId: "fo_test_pick" }),
      ),
    );
    expect(
      await screen.findByTestId("booking-schedule-slot-section"),
    ).toBeInTheDocument();
  });

  describe("Phase E — public booking clarity", () => {
    it("review primary CTA reads See available teams", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(8000);
      const send = screen.getByTestId("booking-direction-send");
      expect(send).toHaveTextContent(BOOKING_REVIEW_SEE_AVAILABLE_TEAMS_CTA);
    });

    it("scheduling shows team section before slots; slots stay hidden until a team is selected", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      expect(screen.getByTestId("booking-schedule-team-section")).toBeInTheDocument();
      expect(screen.getByText(BOOKING_SCHEDULE_CHOOSE_TEAM_TITLE)).toBeInTheDocument();
      expect(screen.queryByTestId("booking-schedule-slot-section")).toBeNull();
      fireEvent.click(screen.getByText("North Team"));
      expect(await screen.findByTestId("booking-schedule-slot-section")).toBeInTheDocument();
      expect(screen.getByText(BOOKING_SCHEDULE_SLOTS_TITLE)).toBeInTheDocument();
    });

    it("availability refetches when the selected team changes (slots follow the team)", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      fireEvent.click(screen.getByText("North Team"));
      const slotSection = await screen.findByTestId("booking-schedule-slot-section");
      const confirmEl = () => screen.getByTestId("booking-schedule-confirm-booking");
      const firstSlotButton = () =>
        within(slotSection)
          .getAllByRole("button")
          .find((b) => b !== confirmEl())!;
      await waitFor(() => expect(firstSlotButton()).toBeTruthy());
      const northSlotLabel = firstSlotButton()!.textContent;
      postPublicBookingAvailabilityMock.mockClear();
      fireEvent.click(screen.getByText("South Team"));
      await waitFor(() =>
        expect(postPublicBookingAvailabilityMock).toHaveBeenCalledWith(
          expect.objectContaining({ bookingId: "bk_test", foId: "fo_second" }),
        ),
      );
      await waitFor(() => expect(firstSlotButton()!.textContent).not.toEqual(northSlotLabel));
    });

    it("confirm stays disabled until a slot is chosen; summary appears with team + slot", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      fireEvent.click(screen.getByText("North Team"));
      await screen.findByTestId("booking-schedule-slot-section");
      const confirm = screen.getByTestId("booking-schedule-confirm-booking");
      expect(confirm).toBeDisabled();
      expect(screen.getByText(BOOKING_SCHEDULE_CHOOSE_SLOT_HINT)).toBeInTheDocument();
      const slotSection = screen.getByTestId("booking-schedule-slot-section");
      const slotBtn = within(slotSection)
        .getAllByRole("button")
        .find((b) => b !== confirm)!;
      fireEvent.click(slotBtn);
      await waitFor(() => expect(confirm).not.toBeDisabled());
      const summary = screen.getByTestId("booking-schedule-summary");
      expect(within(summary).getByText(BOOKING_SCHEDULE_SUMMARY_TITLE)).toBeInTheDocument();
      expect(within(summary).getByText("North Team")).toBeInTheDocument();
    });

    it("confirm runs hold then confirm and navigates to confirmation", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      fireEvent.click(screen.getByText("North Team"));
      await screen.findByTestId("booking-schedule-slot-section");
      const confirmEl = screen.getByTestId("booking-schedule-confirm-booking");
      const slotSection = screen.getByTestId("booking-schedule-slot-section");
      const slotBtn = within(slotSection)
        .getAllByRole("button")
        .find((b) => b !== confirmEl)!;
      fireEvent.click(slotBtn);
      const confirm = await screen.findByTestId("booking-schedule-confirm-booking");
      await waitFor(() => expect(confirm).not.toBeDisabled());
      fireEvent.click(confirm);
      await waitFor(() => expect(postPublicBookingHoldMock).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(postPublicBookingConfirmMock).toHaveBeenCalledTimes(1));
      expect(postPublicBookingHoldMock).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: "bk_test",
          slotId: "server-slot:fo_test_pick:2030-04-15T14:00:00.000Z",
          foId: "fo_test_pick",
          startAt: "2030-04-15T14:00:00.000Z",
          endAt: "2030-04-15T16:00:00.000Z",
        }),
      );
      await waitFor(() =>
        expect(routerPush).toHaveBeenCalledWith(
          expect.stringMatching(/^\/book\/confirmation\?/),
        ),
      );
    });
  });

  describe("Phase F — launch hardening", () => {
    beforeEach(() => {
      postPublicBookingAvailabilityMock.mockImplementation(defaultPostPublicBookingAvailability);
      postPublicBookingHoldMock.mockResolvedValue({
        kind: "public_booking_hold" as const,
        bookingId: "bk_test",
        holdId: "hold_test",
        expiresAt: "2030-04-15T18:00:00.000Z",
        window: {
          foId: "fo_test_pick",
          startAt: "2030-04-15T14:00:00.000Z",
          endAt: "2030-04-15T16:00:00.000Z",
        },
      });
      postPublicBookingConfirmMock.mockResolvedValue({
        kind: "public_booking_confirmation" as const,
        bookingId: "bk_test",
        scheduledStart: "2030-04-15T14:00:00.000Z",
        scheduledEnd: "2030-04-15T16:00:00.000Z",
        status: "confirmed",
        alreadyApplied: false,
      });
    });

    it("zero teams from availability shows fallback with adjust CTA", async () => {
      postPublicBookingAvailabilityMock.mockImplementation(async (body) => {
        if (body.foId) return defaultPostPublicBookingAvailability(body);
        return {
          kind: "public_booking_team_options" as const,
          bookingId: body.bookingId,
          teams: [],
          selectionRequired: true as const,
        };
      });
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      expect(
        await screen.findByTestId("booking-schedule-zero-teams-fallback"),
      ).toBeInTheDocument();
      expect(screen.getByText(BOOKING_SCHEDULE_ZERO_TEAMS_TITLE)).toBeInTheDocument();
      expect(screen.getByTestId("booking-schedule-adjust-details")).toBeInTheDocument();
      expect(screen.queryByTestId("booking-schedule-confirm-booking")).toBeNull();
      expect(emitBookingFunnelEventMock).toHaveBeenCalledWith(
        "no_teams_available",
        expect.objectContaining({ bookingId: "bk_test" }),
      );
    });

    it("team with zero slots shows no-slots fallback and switch team when two teams exist", async () => {
      postPublicBookingAvailabilityMock.mockImplementation(async (body) => {
        if (body.foId === "fo_test_pick") {
          return {
            kind: "public_booking_team_availability" as const,
            bookingId: body.bookingId,
            selectedTeam: { id: body.foId, displayName: "North Team" },
            windows: [],
          };
        }
        if (body.foId) return defaultPostPublicBookingAvailability(body);
        return defaultPostPublicBookingAvailability(body);
      });
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      fireEvent.click(screen.getByText("North Team"));
      expect(
        await screen.findByTestId("booking-schedule-no-slots-fallback"),
      ).toBeInTheDocument();
      expect(screen.getByText(BOOKING_SCHEDULE_NO_SLOTS_FOR_TEAM_TITLE)).toBeInTheDocument();
      expect(screen.getByTestId("booking-schedule-switch-team")).toBeInTheDocument();
      expect(emitBookingFunnelEventMock).toHaveBeenCalledWith(
        "no_slots_available",
        expect.objectContaining({ teamId: "fo_test_pick" }),
      );
    });

    it("hold slot-not-available clears selection and refreshes availability", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      postPublicBookingHoldMock.mockRejectedValueOnce(
        new PublicBookingApiError({
          code: "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
          status: 400,
          message: BOOKING_SCHEDULE_HOLD_FAILED,
        }),
      );
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      const { confirm } = await selectNorthTeamAndFirstSlot();
      const availabilityCallsBefore = postPublicBookingAvailabilityMock.mock.calls.filter(
        (c) => (c[0] as { foId?: string }).foId === "fo_test_pick",
      ).length;
      fireEvent.click(confirm);
      await waitFor(() =>
        expect(screen.getByTestId("booking-schedule-commit-error")).toHaveTextContent(
          BOOKING_SCHEDULE_HOLD_FAILED,
        ),
      );
      expect(screen.getByText(BOOKING_SCHEDULE_HOLD_FAILED_HINT)).toBeInTheDocument();
      expect(screen.queryByTestId("booking-schedule-summary")).not.toBeInTheDocument();
      await waitFor(() => expect(confirm).toBeDisabled());
      expect(postPublicBookingConfirmMock).not.toHaveBeenCalled();
      expect(emitBookingFunnelEventMock).toHaveBeenCalledWith(
        "hold_failed",
        expect.objectContaining({ bookingId: "bk_test" }),
      );
      await waitFor(() => {
        const after = postPublicBookingAvailabilityMock.mock.calls.filter(
          (c) => (c[0] as { foId?: string }).foId === "fo_test_pick",
        ).length;
        expect(after).toBeGreaterThan(availabilityCallsBefore);
      });
    });

    it("clears selected slot when refreshed availability no longer contains its slotId", async () => {
      let teamAvailabilityCalls = 0;
      postPublicBookingAvailabilityMock.mockImplementation(async (body) => {
        if (!body.foId) return defaultPostPublicBookingAvailability(body);
        teamAvailabilityCalls += 1;
        if (teamAvailabilityCalls === 1) return defaultPostPublicBookingAvailability(body);
        return {
          kind: "public_booking_team_availability" as const,
          bookingId: body.bookingId,
          selectedTeam: { id: body.foId, displayName: "North Team" },
          windows: [
            {
              slotId: `server-slot:${body.foId}:2030-04-15T18:00:00.000Z`,
              foId: body.foId,
              foDisplayName: "North Team",
              startAt: "2030-04-15T18:00:00.000Z",
              endAt: "2030-04-15T20:00:00.000Z",
              durationMinutes: 120,
            },
          ],
        };
      });
      postPublicBookingHoldMock.mockRejectedValueOnce(new Error("transient hold failure"));
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      const { confirm } = await selectNorthTeamAndFirstSlot();
      fireEvent.click(confirm);
      await waitFor(() =>
        expect(screen.getByTestId("booking-schedule-commit-error")).toHaveTextContent(
          BOOKING_SCHEDULE_HOLD_FAILED,
        ),
      );
      await waitFor(() => expect(screen.queryByTestId("booking-schedule-summary")).toBeNull());
      expect(confirm).toBeDisabled();
      expect(screen.getByText(BOOKING_SCHEDULE_CHOOSE_SLOT_HINT)).toBeInTheDocument();
    });

    it("invalid signed slotId response does not proceed", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      postPublicBookingHoldMock.mockRejectedValueOnce(
        new PublicBookingApiError({
          code: "PUBLIC_BOOKING_INVALID_SLOT_ID",
          status: 400,
          message: BOOKING_SCHEDULE_HOLD_FAILED,
        }),
      );
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      const { confirm } = await selectNorthTeamAndFirstSlot();
      const depositPrepareCallsBefore = postPublicBookingDepositPrepareMock.mock.calls.length;
      fireEvent.click(confirm);
      await waitFor(() => expect(confirm).toBeDisabled());
      expect(screen.queryByTestId("booking-schedule-summary")).not.toBeInTheDocument();
      expect(postPublicBookingDepositPrepareMock).toHaveBeenCalledTimes(
        depositPrepareCallsBefore,
      );
      expect(postPublicBookingConfirmMock).not.toHaveBeenCalled();
      await waitFor(() => {
        const after = postPublicBookingAvailabilityMock.mock.calls.filter(
          (c) => (c[0] as { foId?: string }).foId === "fo_test_pick",
        ).length;
        expect(after).toBeGreaterThan(1);
      });
    });

    it("restored selected slot is not trusted unless present in latest availability", () => {
      render(
        <BookingStepSchedule
          state={{
            ...defaultBookingFlowState,
            step: "schedule",
            schedulingBookingId: "bk_test",
            selectedTeamId: "fo_test_pick",
            selectedTeamDisplayName: "North Team",
            selectedSlotId: "stale-slot-id",
            selectedSlotStart: "2030-04-15T14:00:00.000Z",
            selectedSlotEnd: "2030-04-15T16:00:00.000Z",
            availableTeams: [
              { id: "fo_test_pick", displayName: "North Team", isRecommended: true },
            ],
            availableWindows: [
              {
                slotId: "current-slot-id",
                startAt: "2030-04-15T18:00:00.000Z",
                endAt: "2030-04-15T20:00:00.000Z",
                durationMinutes: 120,
              },
            ],
          }}
          serviceId={defaultBookingFlowState.serviceId}
          teamsLoading={false}
          windowsLoading={false}
          confirmLoading={false}
          surfaceError={null}
          teamsEmptyState="none"
          teamsLoadSlowHint={false}
          windowsLoadSlowHint={false}
          slotsEmptyForSelectedTeam={false}
          scheduleCommitError={BOOKING_SCHEDULE_HOLD_FAILED}
          scheduleCommitPhase="hold_failed"
          hasAlternateTeamToSwitchTo={false}
          onSelectTeam={vi.fn()}
          onSelectSlot={vi.fn()}
          onConfirmArrival={vi.fn()}
          onAdjustScheduleDetails={vi.fn()}
          onContinueManualFollowUp={vi.fn()}
          onBackToReviewFromSchedule={vi.fn()}
          onSwitchToAlternateTeam={vi.fn()}
          onRetryConfirmBooking={vi.fn()}
          onChooseDifferentTimeAfterConfirmFail={vi.fn()}
        />,
      );
      expect(screen.queryByTestId("booking-schedule-summary")).not.toBeInTheDocument();
      expect(screen.getByTestId("booking-schedule-confirm-booking")).toBeDisabled();
      expect(screen.getByText(BOOKING_SCHEDULE_CHOOSE_SLOT_HINT)).toBeInTheDocument();
    });

    it("current slotId remains selected after availability refresh when still present", async () => {
      postPublicBookingHoldMock.mockRejectedValueOnce(new Error("transient hold failure"));
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      const { confirm } = await selectNorthTeamAndFirstSlot();
      fireEvent.click(confirm);
      await waitFor(() =>
        expect(screen.getByTestId("booking-schedule-commit-error")).toHaveTextContent(
          BOOKING_SCHEDULE_HOLD_FAILED,
        ),
      );
      await waitFor(() => expect(screen.getByTestId("booking-schedule-summary")).toBeInTheDocument());
      expect(confirm).not.toBeDisabled();
    });

    it("confirm failure shows retry and second confirm succeeds", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      postPublicBookingConfirmMock
        .mockRejectedValueOnce(new Error("confirm fail"))
        .mockResolvedValueOnce({
          kind: "public_booking_confirmation" as const,
          bookingId: "bk_test",
          scheduledStart: "2030-04-15T14:00:00.000Z",
          scheduledEnd: "2030-04-15T16:00:00.000Z",
          status: "confirmed",
          alreadyApplied: false,
        });
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      fireEvent.click(screen.getByText("North Team"));
      await screen.findByTestId("booking-schedule-slot-section");
      const confirmEl = screen.getByTestId("booking-schedule-confirm-booking");
      const slotSection = screen.getByTestId("booking-schedule-slot-section");
      const slotBtn = within(slotSection)
        .getAllByRole("button")
        .find((b) => b !== confirmEl)!;
      fireEvent.click(slotBtn);
      await waitFor(() => expect(confirmEl).not.toBeDisabled());
      fireEvent.click(confirmEl);
      await waitFor(() =>
        expect(screen.getByTestId("booking-schedule-commit-error")).toHaveTextContent(
          BOOKING_SCHEDULE_CONFIRM_FAILED,
        ),
      );
      expect(emitBookingFunnelEventMock).toHaveBeenCalledWith(
        "confirm_failed",
        expect.objectContaining({ bookingId: "bk_test" }),
      );
      fireEvent.click(screen.getByTestId("booking-schedule-retry-confirm"));
      await waitFor(() => expect(postPublicBookingConfirmMock).toHaveBeenCalledTimes(2));
      await waitFor(() =>
        expect(routerPush).toHaveBeenCalledWith(
          expect.stringMatching(/^\/book\/confirmation\?/),
        ),
      );
    });

    it("emits funnel events for team select, slot select, and confirm click", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      emitBookingFunnelEventMock.mockClear();
      fireEvent.click(screen.getByText("North Team"));
      await waitFor(() =>
        expect(emitBookingFunnelEventMock).toHaveBeenCalledWith(
          "team_selected",
          expect.objectContaining({ teamId: "fo_test_pick", index: 0 }),
        ),
      );
      emitBookingFunnelEventMock.mockClear();
      const confirmEl = screen.getByTestId("booking-schedule-confirm-booking");
      const slotSection = await screen.findByTestId("booking-schedule-slot-section");
      const slotBtn = within(slotSection)
        .getAllByRole("button")
        .find((b) => b !== confirmEl)!;
      fireEvent.click(slotBtn);
      await waitFor(() =>
        expect(emitBookingFunnelEventMock).toHaveBeenCalledWith(
          "slot_selected",
          expect.objectContaining({ startAt: "2030-04-15T14:00:00.000Z" }),
        ),
      );
      emitBookingFunnelEventMock.mockClear();
      fireEvent.click(confirmEl);
      await waitFor(() =>
        expect(emitBookingFunnelEventMock).toHaveBeenCalledWith(
          "confirm_clicked",
          expect.objectContaining({ bookingId: "bk_test" }),
        ),
      );
    });
  });

  it("submit omits preferredFoId when no preference is selected", async () => {
    submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
    bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
    render(<BookingFlowClient />);
    await fillReviewContactAndOptionalFirstTimePlan(8000);
    const send = screen.getByTestId("booking-direction-send");
    fireEvent.click(send);
    await waitFor(() => expect(submitBookingDirectionIntakeMock).toHaveBeenCalled());
    const payload = submitBookingDirectionIntakeMock.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(payload.preferredFoId).toBeUndefined();
  });

  it("allows a second submit only after a recoverable failure has cleared", async () => {
    bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
    submitBookingDirectionIntakeMock
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(submitSuccess);

    render(<BookingFlowClient />);

    await fillReviewContactAndOptionalFirstTimePlan(5000);

    const send = screen.getByTestId("booking-direction-send");

    fireEvent.click(send);

    await waitFor(() =>
      expect(screen.getByText(BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD)).toBeInTheDocument(),
    );

    const retry = await screen.findByRole("button", {
      name: BOOKING_REVIEW_SUBMIT_TRY_AGAIN,
    });
    await waitFor(() => expect(retry).not.toBeDisabled());
    fireEvent.click(retry);

    await waitFor(() => expect(submitBookingDirectionIntakeMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByTestId("booking-schedule-team-section")).toBeInTheDocument(),
    );
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("fresh-start consume resets review submit recovery and returns to cold funnel entry", async () => {
    bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
    submitBookingDirectionIntakeMock.mockRejectedValue(new Error("network"));

    const { unmount } = render(<BookingFlowClient key="round-1" />);

    await fillReviewContactAndOptionalFirstTimePlan(5000);

    const send = screen.getByTestId("booking-direction-send");
    fireEvent.click(send);

    await waitFor(() =>
      expect(screen.getByText(BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD)).toBeInTheDocument(),
    );

    unmount();
    markBookingFlowFreshStartRequested();
    bookingFlowTestSearch.sp = new URLSearchParams();

    render(<BookingFlowClient key="round-2" />);

    await waitFor(() =>
      expect(screen.queryByText(BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD)).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId("booking-direction-send")).toBeNull();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("fresh-start wins over a shaped review URL and stale confirmation snapshot", () => {
    sessionStorage.setItem(
      BOOKING_CONFIRMATION_SESSION_KEY,
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        intakeId: "in_from_confirmation_only",
        bookingId: "bk_from_confirmation_only",
        priceCents: 999,
        durationMinutes: 60,
        confidence: 0.5,
        bookingErrorCode: "",
      }),
    );
    markBookingFlowFreshStartRequested();
    bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());

    render(<BookingFlowClient key="fresh-wins" />);

    expect(screen.queryByText(BOOKING_REVIEW_STEP_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(/in_from_confirmation_only/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("cold /book entry does not surface confirmation snapshot intake id in the funnel", () => {
    sessionStorage.setItem(
      BOOKING_CONFIRMATION_SESSION_KEY,
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        intakeId: "in_session_only",
        bookingId: "",
        priceCents: null,
        durationMinutes: null,
        confidence: null,
        bookingErrorCode: "",
      }),
    );
    bookingFlowTestSearch.sp = new URLSearchParams();

    render(<BookingFlowClient />);

    expect(screen.queryByText(/in_session_only/)).not.toBeInTheDocument();
    expect(screen.queryByText(BOOKING_REVIEW_STEP_TITLE)).not.toBeInTheDocument();
  });

  describe("public booking architecture — taxonomy, recurring gate, location order", () => {
    it("shows the four canonical public service options", () => {
      bookingFlowTestSearch.sp = new URLSearchParams("step=service");
      render(<BookingFlowClient />);
      const root = screen.getByTestId("booking-public-service-options");
      expect(within(root).getByText(BOOKING_PUBLIC_CARD_ONE_TIME_TITLE)).toBeInTheDocument();
      expect(
        within(root).getByText(BOOKING_PUBLIC_CARD_FIRST_TIME_WITH_RECURRING_TITLE),
      ).toBeInTheDocument();
      expect(within(root).getByText(BOOKING_PUBLIC_CARD_MOVE_TITLE)).toBeInTheDocument();
      expect(within(root).getByText(BOOKING_PUBLIC_CARD_RECURRING_TITLE)).toBeInTheDocument();
    });

    it("selecting recurring shows auth gate CTAs, blocks anonymous progression, and never reaches schedule", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams("step=service");
      render(<BookingFlowClient />);
      const options = screen.getByTestId("booking-public-service-options");
      fireEvent.click(within(options).getByText(BOOKING_PUBLIC_CARD_RECURRING_TITLE));
      expect(screen.getByTestId("booking-recurring-auth-gate")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: BOOKING_RECURRING_GATE_LOGIN_CTA })).toHaveAttribute(
        "href",
        "/customer/auth",
      );
      expect(
        screen.getByRole("link", { name: BOOKING_RECURRING_GATE_REGISTER_CTA }),
      ).toHaveAttribute("href", "/customer/auth");
      expect(screen.queryByTestId("booking-schedule-team-section")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: BOOKING_PUBLIC_SERVICE_SECTION_TITLE,
        }),
      ).toBeInTheDocument();
      expect(screen.getByText(BOOKING_SERVICE_STEP_RECURRING_CONTINUE_BLOCKED)).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 2, name: "Tell us about your home" }),
      ).not.toBeInTheDocument();
    });

    it("selecting One-Time Cleaning allows Continue to home details", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams("step=service");
      render(<BookingFlowClient />);
      const options = screen.getByTestId("booking-public-service-options");
      fireEvent.click(within(options).getByText(BOOKING_PUBLIC_CARD_ONE_TIME_TITLE));
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
      await chooseResetIntentAndContinue();
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { level: 2, name: "Tell us about your home" }),
        ).toBeInTheDocument(),
      );
    });

    it("selecting First-Time Cleaning With Recurring Service allows Continue to home details", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams("step=service");
      render(<BookingFlowClient />);
      const options = screen.getByTestId("booking-public-service-options");
      fireEvent.click(
        within(options).getByText(BOOKING_PUBLIC_CARD_FIRST_TIME_WITH_RECURRING_TITLE),
      );
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
      await chooseResetIntentAndContinue();
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { level: 2, name: "Tell us about your home" }),
        ).toBeInTheDocument(),
      );
    });

    it("selecting move-in/move-out allows Continue to home details", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams("step=service");
      render(<BookingFlowClient />);
      const options = screen.getByTestId("booking-public-service-options");
      fireEvent.click(within(options).getByText(BOOKING_PUBLIC_CARD_MOVE_TITLE));
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
      await chooseResetIntentAndContinue();
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { level: 2, name: "Tell us about your home" }),
        ).toBeInTheDocument(),
      );
    });

    it("advances home → service location before review (ZIP gate)", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `step=home&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday${TEST_INTENT_QUERY}&service=${encodeURIComponent(
          getBookingDefaultServiceId(),
        )}&dcProgram=single_visit`,
      );
      render(<BookingFlowClient />);
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { level: 2, name: "Service location" }),
        ).toBeInTheDocument(),
      );
    });

    it("home step has no early scheduling preference section", () => {
      const svc = getBookingDefaultServiceId();
      const dc = isDeepCleaningBookingServiceId(svc) ? "&dcProgram=single_visit" : "";
      bookingFlowTestSearch.sp = new URLSearchParams(
        `step=home&homeSize=2000&bedrooms=2&bathrooms=2&pets=${TEST_INTENT_QUERY}&service=${encodeURIComponent(svc)}${dc}`,
      );
      render(<BookingFlowClient />);
      expect(screen.queryByTestId("booking-home-cadence-section")).not.toBeInTheDocument();
    });

    it("service location blocks Continue until street, city, state, and ZIP are present", async () => {
      const svc = getBookingDefaultServiceId();
      const dc = isDeepCleaningBookingServiceId(svc) ? "&dcProgram=single_visit" : "";
      bookingFlowTestSearch.sp = new URLSearchParams(
        `step=location&homeSize=2000&bedrooms=2&bathrooms=2&pets=${TEST_INTENT_QUERY}&service=${encodeURIComponent(svc)}${dc}&locZip=94103`,
      );
      render(<BookingFlowClient />);
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
      expect(
        screen.getByText(
          "Enter street address, city, state, and a valid ZIP code before continuing.",
        ),
      ).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(/^street address$/i), {
        target: { value: "1 Main St" },
      });
      fireEvent.change(screen.getByLabelText(/^city$/i), {
        target: { value: "SF" },
      });
      fireEvent.change(screen.getByLabelText(/^state$/i), {
        target: { value: "CA" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_STEP_TITLE)).toBeInTheDocument(),
      );
    });

    it("first-time review shows post-estimate visit spread and recurring conversion options", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(8000);
      const block = await screen.findByTestId("booking-first-time-post-estimate-options");
      expect(block).toBeInTheDocument();
      expect(screen.getByTestId("booking-post-estimate-one_visit")).toBeInTheDocument();
      expect(screen.getByTestId("booking-post-estimate-two_visits")).toBeInTheDocument();
      expect(screen.getByTestId("booking-post-estimate-three_visits")).toBeInTheDocument();
      expect(screen.getByTestId("booking-post-estimate-convert_recurring")).toBeInTheDocument();
    });
  });

  describe("service change", () => {
    it("switching public card from first-time to move-in preserves home context; estimate uses move service", async () => {
      const deepEntry = bookingServiceCatalog.find((x) =>
        isDeepCleaningBookingServiceId(x.id),
      )!;

      bookingFlowTestSearch.sp = new URLSearchParams(
        `step=service&service=${encodeURIComponent(deepEntry.id)}&dcProgram=phased_3_visit&homeSize=2000&bedrooms=2&bathrooms=2&pets=${encodeURIComponent("Cat family")}&frequency=Weekly&preferredTime=Friday`,
      );
      render(<BookingFlowClient />);

      const serviceHeading = screen.getByRole("heading", {
        level: 2,
        name: "Choose your service",
      });
      const serviceSection = serviceHeading.closest("section")!;
      fireEvent.click(within(serviceSection).getByText("Move-In / Move-Out Cleaning"));

      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
      await chooseResetIntentAndContinue();
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
      fireEvent.change(screen.getByLabelText(/^street address$/i), {
        target: { value: "200 Main St" },
      });
      fireEvent.change(screen.getByLabelText(/^city$/i), {
        target: { value: "San Francisco" },
      });
      fireEvent.change(screen.getByLabelText(/^state$/i), {
        target: { value: "CA" },
      });
      fireEvent.change(screen.getByLabelText(/^ZIP code$/i), {
        target: { value: "94103" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_STEP_TITLE)).toBeInTheDocument(),
      );

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(within(homeBlock).getByText("1,800–2,199 sq ft")).toBeInTheDocument();
      expect(within(homeBlock).getByText(/Cat family/i)).toBeInTheDocument();

      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(/One-time \(public booking\)/i),
      ).toBeInTheDocument();
      expect(
        within(scheduleBlock).getByText(BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE),
      ).toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { serviceId?: string }).serviceId === phase4ServiceIds.move,
          ),
        ).toBe(true),
      );
    });
  });

  describe("schedule change", () => {
    it("estimate preview uses deferred preferred time (no early arrival preference on home)", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);
      await waitFor(() => expect(previewEstimateMock).toHaveBeenCalled());
      expect(previewEstimateMock.mock.calls[0]?.[0]).toMatchObject({
        preferredTime: BOOKING_INTAKE_PREFERRED_TIME_DEFERRED,
        serviceLocation: {
          street: "100 Market St",
          city: "San Francisco",
          state: "CA",
          zip: "94103",
        },
      });
    });

    it("from review, backing to home, changing square footage, then returning updates the home summary", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan();

      goHomeFromReviewViaBackOnce();

      fireEvent.change(screen.getByLabelText(/^square footage$/i), {
        target: { value: "2400" },
      });

      await continueThroughLocationGateToReview();

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(within(homeBlock).getByText("2,200–2,599 sq ft")).toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { homeSize?: string }).homeSize === "2400",
          ),
        ).toBe(true),
      );
    });

    it("backing out of review during a stuck submit leaves home details editable (no review send control)", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockImplementation(
        () => new Promise(() => {}),
      );

      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);
      const send = screen.getByTestId("booking-direction-send");
      fireEvent.click(send);

      await waitFor(() =>
        expect(screen.getByTestId("booking-direction-send")).toBeDisabled(),
      );

      fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
      if (
        screen.queryByRole("heading", {
          level: 2,
          name: "Service location",
        })
      ) {
        fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
      }

      await waitFor(() =>
        expect(screen.queryByTestId("booking-direction-send")).not.toBeInTheDocument(),
      );

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Tell us about your home",
        }),
      ).toBeInTheDocument();

      expect(screen.getByTestId("booking-home-size-range")).toBeInTheDocument();
    });
  });

  describe("home detail change", () => {
    function buildHomeStepSearchString(): string {
      const svc = getBookingDefaultServiceId();
      const dc = isDeepCleaningBookingServiceId(svc) ? "&dcProgram=single_visit" : "";
      return `step=home&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday${TEST_INTENT_QUERY}&service=${encodeURIComponent(
        svc,
      )}${dc}`;
    }

    it("from review, home size edit preserves schedule; preview uses new home size", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();

      fireEvent.change(screen.getByLabelText(/^square footage$/i), {
        target: { value: "2400" },
      });

      await continueThroughLocationGateToReview();

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(/One-time \(public booking\)/i),
      ).toBeInTheDocument();
      expect(
        within(scheduleBlock).getByText(BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE),
      ).toBeInTheDocument();

      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(within(homeBlock).getByText("2,200–2,599 sq ft")).toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { homeSize?: string }).homeSize === "2400",
          ),
        ).toBe(true),
      );
    });

    it("from review, bedroom change preserves schedule; preview uses new bedroom value", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();

      fireEvent.change(
        screen.getByLabelText(new RegExp(BOOKING_BEDROOMS_FIELD_LABEL, "i")),
        { target: { value: "3" } },
      );

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { bedrooms?: string }).bedrooms === "3",
          ),
        ).toBe(true),
      );
    });

    it("clearing home size on the home step blocks advancing (Continue does not leave home)", () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildHomeStepSearchString());
      render(<BookingFlowClient />);

      fireEvent.change(screen.getByLabelText(/^square footage$/i), {
        target: { value: "" },
      });

      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Tell us about your home",
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE }),
      ).not.toBeInTheDocument();
    });

    it("pets-only edit preserves schedule on return to review and reaches preview with new pets", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();

      fireEvent.change(screen.getByLabelText(/pets \(optional free text\)/i), {
        target: { value: "One dog" },
      });

      await continueThroughLocationGateToReview();

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(/One-time \(public booking\)/i),
      ).toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { pets?: string }).pets === "One dog",
          ),
        ).toBe(true),
      );
    });

    it("backing out of a stuck submit to home allows editing home size (review send gone)", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockImplementation(
        () => new Promise(() => {}),
      );

      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);
      const send = screen.getByTestId("booking-direction-send");
      fireEvent.click(send);

      await waitFor(() =>
        expect(screen.getByTestId("booking-direction-send")).toBeDisabled(),
      );

      fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
      if (
        screen.queryByRole("heading", {
          level: 2,
          name: "Service location",
        })
      ) {
        fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
      }
      await waitFor(() =>
        expect(screen.queryByTestId("booking-direction-send")).not.toBeInTheDocument(),
      );

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Tell us about your home",
        }),
      ).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/^square footage$/i), {
        target: { value: "2800" },
      });
    });
  });

  describe("contact change", () => {
    it("from review, name change preserves service/home/schedule; preview uses new name when send is ready again", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);
      const send = screen.getByTestId("booking-direction-send");

      previewEstimateMock.mockClear();
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: "Jordan Lee" },
      });

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { customerName?: string }).customerName === "Jordan Lee",
          ),
        ).toBe(true),
      );

      await waitFor(
        () =>
          expect(screen.getByTestId("booking-direction-send")).not.toBeDisabled(),
        { timeout: 5000 },
      );

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(/One-time \(public booking\)/i),
      ).toBeInTheDocument();
      expect(
        within(scheduleBlock).getByText(BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE),
      ).toBeInTheDocument();

      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(within(homeBlock).getByText("1,800–2,199 sq ft")).toBeInTheDocument();

      const serviceBlock = within(reviewRoot)
        .getByText("Service")
        .closest("div.rounded-2xl")!;
      expect(within(serviceBlock).getByText("One-Time Cleaning")).toBeInTheDocument();
    });

    it("from review, invalid email disables send until contact is valid again; schedule stays intact", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);
      const send = screen.getByTestId("booking-direction-send");

      fireEvent.change(screen.getByLabelText(/^email$/i), {
        target: { value: "not-an-email" },
      });

      await waitFor(() =>
        expect(screen.getByTestId("booking-direction-send")).toBeDisabled(),
      );

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(/One-time \(public booking\)/i),
      ).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/^email$/i), {
        target: { value: "jordan@example.com" },
      });

      await waitFor(
        () =>
          expect(screen.getByTestId("booking-direction-send")).not.toBeDisabled(),
        { timeout: 5000 },
      );
    });

    it("clearing required contact on review keeps service, home, and schedule summaries", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      fillReviewContactFast();
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/full name/i), {
          target: { value: "" },
        });
      });

      expect(
        screen.getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE }),
      ).toBeInTheDocument();

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(/One-time \(public booking\)/i),
      ).toBeInTheDocument();

      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(within(homeBlock).getByText("1,800–2,199 sq ft")).toBeInTheDocument();
    });

    it("after a recoverable submit failure, editing contact clears the recovery banner", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValueOnce(submitSuccess);

      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);
      const send = screen.getByTestId("booking-direction-send");
      fireEvent.click(send);

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD)).toBeInTheDocument(),
      );

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: "Alex Rivera Jr." },
      });

      await waitFor(() =>
        expect(
          screen.queryByText(BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD),
        ).not.toBeInTheDocument(),
      );
    });

    it("during a stuck submit, editing contact keeps send disabled (no overlapping send control)", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockImplementation(
        () => new Promise(() => {}),
      );

      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);
      const send = screen.getByTestId("booking-direction-send");
      fireEvent.click(send);

      await waitFor(() =>
        expect(screen.getByTestId("booking-direction-send")).toBeDisabled(),
      );

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/full name/i), {
          target: { value: "Alex Rivera Updated" },
        });
      });

      expect(screen.getByTestId("booking-direction-send")).toBeDisabled();
    });
  });

  describe("continue and advance truth", () => {
    it("invalid Continue from home does not advance and surfaces only the home-step error", () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildIncompleteHomeStepSearchString());
      render(<BookingFlowClient />);

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Tell us about your home",
        }),
      ).toBeInTheDocument();

      const continueBtn = screen.getByRole("button", { name: /^continue$/i });
      fireEvent.click(continueBtn);

      expect(
        screen.getByText(
          "Please complete your home details before continuing.",
        ),
      ).toBeInTheDocument();
      expect(continueBtn).toHaveAttribute("aria-invalid", "true");
      expect(continueBtn).toHaveAttribute(
        "aria-describedby",
        "booking-step-continue-error",
      );

      expect(
        screen.queryByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE }),
      ).not.toBeInTheDocument();
    });

    it("after an invalid home Continue, fixing the missing field clears stale attempt UI and Continue reaches review", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildIncompleteHomeStepSearchString());
      render(<BookingFlowClient />);

      const continueBtn = screen.getByRole("button", { name: /^continue$/i });
      fireEvent.click(continueBtn);

      expect(
        screen.getByText(
          "Please complete your home details before continuing.",
        ),
      ).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/^square footage$/i), {
        target: { value: "2400" },
      });

      await waitFor(() =>
        expect(
          screen.queryByText(
            "Please complete your home details before continuing.",
          ),
        ).not.toBeInTheDocument(),
      );

      expect(continueBtn).toHaveAttribute("aria-invalid", "false");
      expect(continueBtn).not.toHaveAttribute("aria-describedby");

      await continueThroughLocationGateToReview();
    });

    it("invalid Continue from home does not advance when home size range is incomplete", () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildIncompleteCadenceHomeSearchString(),
      );
      render(<BookingFlowClient />);

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Tell us about your home",
        }),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      expect(
        screen.getByText(
          "Please complete your home details before continuing.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", {
          level: 2,
          name: BOOKING_REVIEW_STEP_TITLE,
        }),
      ).not.toBeInTheDocument();

      expect(screen.getByTestId("booking-home-size-range")).toBeInTheDocument();
    });

    it("after an invalid home Continue with missing size range, choosing a range clears stale attempt UI and reaches review", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildIncompleteCadenceHomeSearchString(),
      );
      render(<BookingFlowClient />);

      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      expect(
        screen.getByText(
          "Please complete your home details before continuing.",
        ),
      ).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/^square footage$/i), {
        target: { value: "2000" },
      });

      await waitFor(() =>
        expect(
          screen.queryByText(
            "Please complete your home details before continuing.",
          ),
        ).not.toBeInTheDocument(),
      );

      await continueThroughLocationGateToReview();
    });

    it("backing out of home after an invalid Continue clears the advance error", () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildIncompleteCadenceHomeSearchString(),
      );
      render(<BookingFlowClient />);

      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      expect(
        screen.getByText(
          "Please complete your home details before continuing.",
        ),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /^back$/i }));

      expect(
        screen.queryByText(
          "Please complete your home details before continuing.",
        ),
      ).not.toBeInTheDocument();

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "What brings you in today?",
        }),
      ).toBeInTheDocument();
    });

    it("backing out of review after a recoverable send failure does not show review recovery copy on home", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockRejectedValueOnce(new Error("network"));

      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);
      const send = screen.getByTestId("booking-direction-send");
      fireEvent.click(send);

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD)).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
      if (
        screen.queryByRole("heading", {
          level: 2,
          name: "Service location",
        })
      ) {
        fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
      }

      expect(
        screen.queryByText(BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Tell us about your home",
        }),
      ).toBeInTheDocument();
    });
  });

  describe("review summary parity", () => {
    it("review Home details shows the selected pets option and preview uses the same value", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();

      fireEvent.change(screen.getByLabelText(/pets \(optional free text\)/i), {
        target: { value: "Multiple pets" },
      });

      await continueThroughLocationGateToReview();

      const homeBlock = reviewHomeDetailsSection();
      expect(within(homeBlock).getByText("Multiple pets")).toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { pets?: string }).pets === "Multiple pets",
          ),
        ).toBe(true),
      );
    });

    it("review Home details shows selected size range and preview uses matching numeric band", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();

      fireEvent.change(screen.getByLabelText(/^square footage$/i), {
        target: { value: "3250" },
      });

      await continueThroughLocationGateToReview();

      const homeBlock = reviewHomeDetailsSection();
      expect(within(homeBlock).getByText("3,000–3,499 sq ft")).toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { homeSize?: string }).homeSize === "3250",
          ),
        ).toBe(true),
      );
    });

    it("review schedule explains timing is chosen after team selection", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE),
      ).toBeInTheDocument();
    });

    it("non-deep service review omits deep clean plan row", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildReviewSearchStringForService(phase4ServiceIds.move),
      );
      await act(async () => {
        render(<BookingFlowClient />);
      });

      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE }),
        ).toBeInTheDocument(),
      );
      expect(screen.queryByText("First visit structure:")).not.toBeInTheDocument();
    });

    it("deep-cleaning service review includes first-visit structure summary", async () => {
      const deepId = bookingServiceCatalog.find((s) =>
        isDeepCleaningBookingServiceId(s.id),
      )?.id;
      if (!deepId) return;

      bookingFlowTestSearch.sp = new URLSearchParams(
        buildReviewSearchStringForService(deepId),
      );
      await act(async () => {
        render(<BookingFlowClient />);
      });

      await waitFor(() =>
        expect(screen.getByText("First visit structure:")).toBeInTheDocument(),
      );
    });
  });

  describe("estimator depth phase 1", () => {
    it("changing condition from home updates preview with the canonical condition token", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(screen.getByRole("radio", { name: /major reset needed/i }));
      fireEvent.click(screen.getByRole("radio", { name: /heavy clutter/i }));
      fireEvent.click(screen.getByRole("radio", { name: /^Heavy use$/ }));

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.condition == null &&
              ef?.clutterLevel === "heavy" &&
              ef?.kitchenCondition === "heavy_grease"
            );
          }),
        ).toBe(true),
      );
    });

    it("toggling problem areas sends sorted controlled tokens only", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(screen.getByRole("radio", { name: /^Heavy use$/ }));
      fireEvent.click(screen.getByRole("radio", { name: /heavy detailing/i }));

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.problemAreas == null &&
              ef?.kitchenIntensity === "heavy_use" &&
              ef?.bathroomComplexity === "heavy_detailing"
            );
          }),
        ).toBe(true),
      );
    });

    it("changing surface complexity updates preview", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(screen.getByRole("radio", { name: /many segmented rooms/i }));
      fireEvent.click(screen.getByRole("radio", { name: /moderate clutter/i }));

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.surfaceComplexity == null &&
              ef?.layoutType === "segmented" &&
              ef?.clutterAccess === "moderate_clutter"
            );
          }),
        ).toBe(true),
      );
    });

    it("review shows current condition, focus areas, and surface after edits", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();

      fireEvent.click(screen.getByRole("radio", { name: /recently maintained/i }));
      fireEvent.click(screen.getByRole("radio", { name: /heavy pet impact/i }));
      fireEvent.click(screen.getByRole("radio", { name: /mostly open plan/i }));

      await continueThroughLocationGateToReview();

      const homeBlock = reviewHomeDetailsSection();
      expect(within(homeBlock).getByText("Recently maintained")).toBeInTheDocument();
      expect(within(homeBlock).getByText("Heavy pet impact")).toBeInTheDocument();
      expect(within(homeBlock).getByText(/Mostly open plan/)).toBeInTheDocument();
    });

    it("changing condition from review path preserves schedule and triggers a fresh preview", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(screen.getByRole("radio", { name: /major reset needed/i }));
      fireEvent.click(screen.getByRole("radio", { name: /heavy clutter/i }));
      fireEvent.click(screen.getByRole("radio", { name: /^Heavy use$/ }));

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.condition == null &&
              ef?.clutterLevel === "heavy" &&
              ef?.kitchenCondition === "heavy_grease"
            );
          }),
        ).toBe(true),
      );

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(/One-time \(public booking\)/i),
      ).toBeInTheDocument();
      expect(
        within(scheduleBlock).getByText(BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE),
      ).toBeInTheDocument();
    });
  });

  describe("estimator depth phase 2 — preview transparency", () => {
    it("shows heavy-condition driver bullet when condition is heavy buildup", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("radio", { name: /major reset needed/i }));
      fireEvent.click(screen.getByRole("radio", { name: /heavy clutter/i }));
      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE)).toBeInTheDocument(),
      );
      expect(
        screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_HEAVY_CONDITION),
      ).toBeInTheDocument();
    });

    it("shows problem-area driver bullet when a problem area is selected", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("radio", { name: /^Heavy use$/ }));
      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE)).toBeInTheDocument(),
      );
      expect(
        screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_PROBLEM_AREAS),
      ).toBeInTheDocument();
    });

    it("shows dense-layout driver bullet when surface complexity is dense", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("radio", { name: /many segmented rooms/i }));
      fireEvent.click(screen.getByRole("radio", { name: /moderate clutter/i }));
      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE)).toBeInTheDocument(),
      );
      expect(
        screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DENSE_LAYOUT),
      ).toBeInTheDocument();
    });

    it("hides the driver block when all estimate-driving inputs are at defaults", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      expect(
        screen.queryByText(BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE),
      ).not.toBeInTheDocument();
    });
  });

  describe("estimator depth phase 3 — scope and add-ons", () => {
    it("changing scopeIntensity updates preview intake", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(screen.getByRole("radio", { name: /reset-level clean/i }));
      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.scopeIntensity == null &&
              ef?.primaryIntent === "reset_level" &&
              ef?.firstTimeWithServelink === "yes"
            );
          }),
        ).toBe(true),
      );
    });

    it("toggling add-ons updates preview intake with sorted tokens", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(
        screen.getByRole("button", { name: BOOKING_ADD_ON_LABELS.inside_oven }),
      );
      fireEvent.click(
        screen.getByRole("button", { name: BOOKING_ADD_ON_LABELS.inside_fridge }),
      );

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as { addonIds?: string[] } | undefined;
            return (
              p.selectedAddOns == null &&
              Array.isArray(ef?.addonIds) &&
              ef.addonIds.join(",") === "inside_fridge,inside_oven"
            );
          }),
        ).toBe(true),
      );
    });

    it("review home details show scope of work and add-ons", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("radio", { name: /maintenance clean/i }));
      fireEvent.click(
        screen.getByRole("button", { name: BOOKING_ADD_ON_LABELS.baseboards_detail }),
      );
      await continueThroughLocationGateToReview();

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(within(homeBlock).getByText(/Maintenance clean/)).toBeInTheDocument();
      expect(
        within(homeBlock).getByText(BOOKING_ADD_ON_LABELS.baseboards_detail),
      ).toBeInTheDocument();
      expect(within(homeBlock).getByText(/Primary intent:/)).toBeInTheDocument();
    });

    it("driver block shows detail-heavy and add-on bullets when relevant", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("radio", { name: /reset-level clean/i }));
      fireEvent.click(
        screen.getByRole("button", { name: BOOKING_ADD_ON_LABELS.interior_windows }),
      );
      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE)).toBeInTheDocument(),
      );
      expect(
        screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DETAIL_HEAVY_SCOPE),
      ).toBeInTheDocument();
      expect(
        screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_ADD_ONS),
      ).toBeInTheDocument();
    });

    it("driver block shows add-on bullet only when scope is default and no other drivers", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(
        screen.getByRole("button", { name: BOOKING_ADD_ON_LABELS.cabinets_detail }),
      );
      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE)).toBeInTheDocument(),
      );
      expect(
        screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_ADD_ONS),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DETAIL_HEAVY_SCOPE),
      ).not.toBeInTheDocument();
    });

    it("scope change from review shows wait-for-quote submit label until preview resolves", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      let releasePreview: (value: unknown) => void = () => {};
      previewEstimateMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            releasePreview = resolve;
          }),
      );

      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("radio", { name: /reset-level clean/i }));
      await continueThroughLocationGateToReview();

      const send = screen.getByTestId("booking-direction-send");
      await waitFor(() => expect(send).toBeDisabled(), { timeout: 5000 });
      expect(send).toHaveTextContent(BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_REFRESHING);

      releasePreview({
        kind: "booking_direction_estimate_preview",
        estimate: {
          priceCents: 50000,
          durationMinutes: 180,
          confidence: 0.85,
        },
        deepCleanProgram: null,
      });

      previewEstimateMock.mockResolvedValue({
        kind: "booking_direction_estimate_preview",
        estimate: {
          priceCents: 50000,
          durationMinutes: 180,
          confidence: 0.85,
        },
        deepCleanProgram: null,
      });

      await waitFor(() => expect(send).not.toBeDisabled(), { timeout: 5000 });
    });

    it("changing scope from review path preserves schedule summary", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(screen.getByRole("radio", { name: /maintenance clean/i }));
      await continueThroughLocationGateToReview();

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(/One-time \(public booking\)/i),
      ).toBeInTheDocument();
      expect(
        within(scheduleBlock).getByText(BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE),
      ).toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.scopeIntensity == null &&
              ef?.primaryIntent === "maintenance_clean" &&
              ef?.firstTimeWithServelink === "no" &&
              typeof ef?.clutterLevel === "string"
            );
          }),
        ).toBe(true),
      );
    });
  });

  describe("estimator depth phase 4 — service-specific depth", () => {
    it("deep clean service: changing deepCleanFocus updates preview intake", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildReviewSearchStringForService(phase4ServiceIds.deep),
      );
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_DEEP_CLEAN_FOCUS_LABELS.kitchen_bath_priority,
        }),
      );
      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.deepCleanFocus == null &&
              ef?.kitchenCondition === "heavy_grease" &&
              ef?.bathroomCondition === "heavy_scale"
            );
          }),
        ).toBe(true),
      );
    });

    it("switching away from deep clean removes deep-clean-specific review row", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchStringForService(phase4ServiceIds.deep)}&dcFocus=kitchen_bath_priority`,
      );
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(
        within(homeBlock).getByText(BOOKING_DEEP_CLEAN_FOCUS_LABELS.kitchen_bath_priority),
      ).toBeInTheDocument();

      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
      fireEvent.click(screen.getByRole("button", { name: /^back$/i }));

      await waitFor(() =>
        expect(
          screen.getByRole("heading", {
            level: 2,
            name: BOOKING_PUBLIC_SERVICE_SECTION_TITLE,
          }),
        ).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByText(BOOKING_PUBLIC_CARD_MOVE_TITLE));

      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
      await chooseResetIntentAndContinue();
      await continueThroughLocationGateToReview();

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      const reviewRoot2 = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const homeBlock2 = within(reviewRoot2)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(
        within(homeBlock2).queryByText(`${BOOKING_REVIEW_DEEP_CLEAN_FOCUS_LABEL}:`),
      ).not.toBeInTheDocument();
    });

    it("move-in/move-out service: appliancePresence is sorted in preview intake", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildReviewSearchStringForService(phase4ServiceIds.move),
      );
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(
        screen.getByRole("button", { name: BOOKING_APPLIANCE_PRESENCE_LABELS.washer_dryer_present }),
      );
      fireEvent.click(
        screen.getByRole("button", { name: BOOKING_APPLIANCE_PRESENCE_LABELS.refrigerator_present }),
      );

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as { addonIds?: string[] } | undefined;
            return (
              p.appliancePresence == null &&
              Array.isArray(ef?.addonIds) &&
              ef.addonIds.includes("inside_fridge") &&
              ef.addonIds.includes("laundry_fold")
            );
          }),
        ).toBe(true),
      );
    });

    it("move-in/move-out service: review shows transition setup and appliances", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildReviewSearchStringForService(phase4ServiceIds.move),
      );
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_TRANSITION_STATE_LABELS.lightly_furnished,
        }),
      );
      fireEvent.click(
        screen.getByRole("button", { name: BOOKING_APPLIANCE_PRESENCE_LABELS.oven_present }),
      );
      await continueThroughLocationGateToReview();

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(
        within(homeBlock).getByText(BOOKING_TRANSITION_STATE_LABELS.lightly_furnished),
      ).toBeInTheDocument();
      expect(
        within(homeBlock).getByText(`${BOOKING_REVIEW_TRANSITION_SETUP_LABEL}:`),
      ).toBeInTheDocument();
      expect(
        within(homeBlock).getByText(BOOKING_APPLIANCE_PRESENCE_LABELS.oven_present),
      ).toBeInTheDocument();
    });

    it("driver block shows deep-clean focus bullet when focus is non-default", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildReviewSearchStringForService(phase4ServiceIds.deep),
      );
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_DEEP_CLEAN_FOCUS_LABELS.high_touch_detail,
        }),
      );
      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE)).toBeInTheDocument(),
      );
      expect(
        screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DEEP_CLEAN_FOCUS),
      ).toBeInTheDocument();
    });

    it("driver block shows move transition bullets when furnished and appliances selected", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildReviewSearchStringForService(phase4ServiceIds.move),
      );
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_TRANSITION_STATE_LABELS.fully_furnished,
        }),
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: BOOKING_APPLIANCE_PRESENCE_LABELS.dishwasher_present,
        }),
      );
      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE)).toBeInTheDocument(),
      );
      expect(
        screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_FURNISHED_TRANSITION),
      ).toBeInTheDocument();
      expect(
        screen.getByText(BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_TRANSITION_APPLIANCES),
      ).toBeInTheDocument();
    });

    it("deep-clean focus change from review shows wait-for-quote submit label until preview resolves", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildReviewSearchStringForService(phase4ServiceIds.deep),
      );
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      let releasePreview: (value: unknown) => void = () => {};
      previewEstimateMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            releasePreview = resolve;
          }),
      );

      goHomeFromReviewViaBackOnce();
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_DEEP_CLEAN_FOCUS_LABELS.kitchen_bath_priority,
        }),
      );
      await continueThroughLocationGateToReview();

      const send = screen.getByTestId("booking-direction-send");
      await waitFor(() => expect(send).toBeDisabled(), { timeout: 5000 });
      expect(send).toHaveTextContent(BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_REFRESHING);

      releasePreview({
        kind: "booking_direction_estimate_preview",
        estimate: {
          priceCents: 50000,
          durationMinutes: 180,
          confidence: 0.85,
        },
        deepCleanProgram: null,
      });

      previewEstimateMock.mockResolvedValue({
        kind: "booking_direction_estimate_preview",
        estimate: {
          priceCents: 50000,
          durationMinutes: 180,
          confidence: 0.85,
        },
        deepCleanProgram: null,
      });

      await waitFor(() => expect(send).not.toBeDisabled(), { timeout: 5000 });
    });

    it("changing deep-clean focus from review preserves schedule summary", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildReviewSearchStringForService(phase4ServiceIds.deep),
      );
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_DEEP_CLEAN_FOCUS_LABELS.high_touch_detail,
        }),
      );
      await continueThroughLocationGateToReview();

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(/One-time \(public booking\)/i),
      ).toBeInTheDocument();
      expect(
        within(scheduleBlock).getByText(BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE),
      ).toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            const ids = ef?.addonIds as string[] | undefined;
            return (
              p.deepCleanFocus == null &&
              ef?.glassShowers === "multiple" &&
              Array.isArray(ids) &&
              ids.includes("interior_windows")
            );
          }),
        ).toBe(true),
      );
    });
  });

  describe("estimator depth phase 5 — planning confidence", () => {
    it("default simpler request shows high-clarity planning copy", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.getByTestId("booking-review-planning-confidence")).toBeInTheDocument();
      expect(screen.getByText(BOOKING_REVIEW_PRE_CONF_HIGH_HEADLINE)).toBeInTheDocument();
      expect(screen.getByText(BOOKING_REVIEW_PRE_CONF_HIGH_SUPPORTING)).toBeInTheDocument();
    });

    it("moderate complexity shows customized band copy", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("radio", { name: /Many segmented rooms/i }));
      fireEvent.click(screen.getByRole("radio", { name: /Moderate clutter/i }));
      await continueThroughLocationGateToReview();
      await waitFor(
        () =>
          expect(screen.getByText(BOOKING_REVIEW_PRE_CONF_CUSTOM_HEADLINE)).toBeInTheDocument(),
        { timeout: 5000 },
      );
    });

    it("heavier combined signals show special-attention band copy", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchString()}&homeSurface=dense_layout&homeCondition=heavy_buildup&homeScope=detail_heavy`,
      );
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      await waitFor(
        () =>
          expect(screen.getByText(BOOKING_REVIEW_PRE_CONF_SPECIAL_HEADLINE)).toBeInTheDocument(),
        { timeout: 5000 },
      );
    });

    it("hides planning confidence while quote is refreshing", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.getByTestId("booking-review-planning-confidence")).toBeInTheDocument();

      let releasePreview: (value: unknown) => void = () => {};
      previewEstimateMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            releasePreview = resolve;
          }),
      );

      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("radio", { name: /Mostly open plan/i }));
      await continueThroughLocationGateToReview();
      await waitFor(
        () =>
          expect(screen.getByTestId("booking-direction-send")).toHaveTextContent(
            BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_REFRESHING,
          ),
        { timeout: 8000 },
      );
      expect(screen.queryByTestId("booking-review-planning-confidence")).not.toBeInTheDocument();

      releasePreview({
        kind: "booking_direction_estimate_preview",
        estimate: {
          priceCents: 50000,
          durationMinutes: 180,
          confidence: 0.85,
        },
        deepCleanProgram: null,
      });
      previewEstimateMock.mockResolvedValue({
        kind: "booking_direction_estimate_preview",
        estimate: {
          priceCents: 50000,
          durationMinutes: 180,
          confidence: 0.85,
        },
        deepCleanProgram: null,
      });

      await waitFor(
        () => expect(screen.getByTestId("booking-review-planning-confidence")).toBeInTheDocument(),
        { timeout: 8000 },
      );
    });

    it("hides planning confidence when preview errors", async () => {
      previewEstimateMock.mockReset();
      previewEstimateMock.mockRejectedValue(new Error("preview unavailable"));
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);
      await waitFor(
        () => expect(screen.getByText(BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_LEAD)).toBeInTheDocument(),
        { timeout: 5000 },
      );
      expect(screen.queryByTestId("booking-review-planning-confidence")).not.toBeInTheDocument();
    });

    it("updates planning confidence after refreshed preview resolves", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.getByText(BOOKING_REVIEW_PRE_CONF_HIGH_HEADLINE)).toBeInTheDocument();

      let releasePreview: (value: unknown) => void = () => {};
      previewEstimateMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            releasePreview = resolve;
          }),
      );

      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("radio", { name: /Many segmented rooms/i }));
      fireEvent.click(screen.getByRole("radio", { name: /Moderate clutter/i }));
      await continueThroughLocationGateToReview();
      await waitFor(
        () =>
          expect(screen.getByTestId("booking-direction-send")).toHaveTextContent(
            BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_REFRESHING,
          ),
        { timeout: 8000 },
      );
      expect(screen.queryByTestId("booking-review-planning-confidence")).not.toBeInTheDocument();

      releasePreview({
        kind: "booking_direction_estimate_preview",
        estimate: {
          priceCents: 50000,
          durationMinutes: 180,
          confidence: 0.85,
        },
        deepCleanProgram: null,
      });
      previewEstimateMock.mockResolvedValue({
        kind: "booking_direction_estimate_preview",
        estimate: {
          priceCents: 50000,
          durationMinutes: 180,
          confidence: 0.85,
        },
        deepCleanProgram: null,
      });

      await waitFor(
        () => expect(screen.getByText(BOOKING_REVIEW_PRE_CONF_CUSTOM_HEADLINE)).toBeInTheDocument(),
        { timeout: 8000 },
      );
    });
  });

  describe("estimator depth phase 6 — prep and recommendations", () => {
    it("selecting inside_fridge shows refrigerator prep guidance", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchString()}&homeAddOns=inside_fridge`,
      );
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.getByTestId("booking-review-prep-guidance")).toBeInTheDocument();
      expect(screen.getByText(BOOKING_REVIEW_PREP_FRIDGE)).toBeInTheDocument();
    });

    it("move service with fully furnished transition shows access prep guidance", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchStringForService(phase4ServiceIds.move)}&mvSetup=fully_furnished`,
      );
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.getByTestId("booking-review-prep-guidance")).toBeInTheDocument();
      expect(screen.getByText(BOOKING_REVIEW_PREP_MOVE_FURNISHED)).toBeInTheDocument();
    });

    it("pets and dense surface produce prep guidance when relevant", async () => {
      const sp = new URLSearchParams(buildReviewSearchString());
      sp.set("pets", "One dog");
      sp.set("homeSurface", "dense_layout");
      bookingFlowTestSearch.sp = sp;
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      const prep = screen.getByTestId("booking-review-prep-guidance");
      expect(within(prep).getByText(BOOKING_REVIEW_PREP_PETS)).toBeInTheDocument();
      expect(within(prep).getByText(BOOKING_REVIEW_PREP_DENSE_LAYOUT)).toBeInTheDocument();
    });

    it("heavy condition without inside oven recommends interior oven line", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchString()}&homeCondition=heavy_buildup`,
      );
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.getByTestId("booking-review-recommendations")).toBeInTheDocument();
      expect(screen.getByText(BOOKING_REVIEW_REC_INSIDE_OVEN)).toBeInTheDocument();
    });

    it("kitchen grease without inside fridge recommends fridge; selecting inside fridge drops that recommendation", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchString()}&homeProblems=kitchen_grease`,
      );
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.getByText(BOOKING_REVIEW_REC_INSIDE_FRIDGE)).toBeInTheDocument();

      goHomeFromReviewViaBackOnce();
      fireEvent.click(
        screen.getByRole("button", { name: BOOKING_ADD_ON_LABELS.inside_fridge }),
      );
      await continueThroughLocationGateToReview();
      expect(screen.queryByText(BOOKING_REVIEW_REC_INSIDE_FRIDGE)).not.toBeInTheDocument();
      expect(screen.getByTestId("booking-review-prep-guidance")).toBeInTheDocument();
      expect(screen.getByText(BOOKING_REVIEW_PREP_FRIDGE)).toBeInTheDocument();
    });

    it("deep clean high-touch focus recommends cabinet detail when not selected", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchStringForService(phase4ServiceIds.deep)}&dcFocus=high_touch_detail`,
      );
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.getByText(BOOKING_REVIEW_REC_CABINETS_DETAIL)).toBeInTheDocument();
    });

    it("bathroom buildup can recommend baseboards when not selected", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchString()}&homeProblems=bathroom_buildup`,
      );
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.getByText(BOOKING_REVIEW_REC_BASEBOARDS_DETAIL)).toBeInTheDocument();
    });

    it("move service does not recommend interior windows when that add-on is already selected", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchStringForService(phase4ServiceIds.move)}&homeAddOns=interior_windows`,
      );
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.queryByText(BOOKING_REVIEW_REC_INTERIOR_WINDOWS)).not.toBeInTheDocument();
    });

    it("shows no prep or recommendation blocks when nothing in scope applies", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.queryByTestId("booking-review-prep-guidance")).not.toBeInTheDocument();
      expect(screen.queryByTestId("booking-review-recommendations")).not.toBeInTheDocument();
    });

    it("prep guidance updates after selecting inside oven from the review path", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      expect(screen.queryByTestId("booking-review-prep-guidance")).not.toBeInTheDocument();

      goHomeFromReviewViaBackOnce();
      fireEvent.click(
        screen.getByRole("button", { name: BOOKING_ADD_ON_LABELS.inside_oven }),
      );
      await continueThroughLocationGateToReview();
      await waitFor(
        () => expect(screen.getByTestId("booking-review-prep-guidance")).toBeInTheDocument(),
        { timeout: 5000 },
      );
      expect(screen.getByText(BOOKING_REVIEW_PREP_OVEN)).toBeInTheDocument();
    });
  });

  describe("Deposit payment authority", () => {
    it("deposit screen appears before team selection and advances to schedule after payment", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      postPublicBookingDepositPrepareMock
        .mockResolvedValueOnce({
          kind: "public_booking_deposit_prepare",
          bookingId: "bk_test",
          paymentMode: "deposit",
          classification: "payment_required",
          clientSecret: "cs_before_schedule",
          paymentIntentId: "pi_before_schedule",
          amountCents: 10000,
          nextAction: "confirm_deposit",
        })
        .mockResolvedValue({
          kind: "public_booking_deposit_prepare",
          bookingId: "bk_test",
          paymentMode: "none",
          classification: "deposit_succeeded",
          publicDepositStatus: "deposit_succeeded",
          paymentIntentId: "pi_before_schedule",
          nextAction: "finalize_booking",
        });
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(8000);
      fireEvent.click(screen.getByTestId("booking-direction-send"));
      await waitFor(() =>
        expect(screen.getByTestId("deposit-mock-pay")).toBeInTheDocument(),
      );
      expect(screen.queryByTestId("booking-schedule-team-section")).not.toBeInTheDocument();
      expect(postPublicBookingDepositPrepareMock).toHaveBeenCalledWith({
        bookingId: "bk_test",
      });
      fireEvent.click(screen.getByTestId("deposit-mock-pay"));
      await waitFor(() =>
        expect(screen.getByTestId("booking-schedule-team-section")).toBeInTheDocument(),
      );
      expect(screen.queryByTestId("deposit-mock-pay")).not.toBeInTheDocument();
    });

    it("schedule confirm 402 renders deposit payment directly and never mirrors client_secret into URL or session snapshot", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      postPublicBookingConfirmMock.mockRejectedValueOnce(
        new PublicBookingPaymentRequiredError({
          kind: "public_booking_deposit_required",
          code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
          message: "need deposit",
          amountCents: 10000,
          currency: "usd",
          clientSecret: "cs_from_server_should_not_persist",
          paymentIntentId: "pi_from_server",
        }),
      );
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      fireEvent.click(screen.getByText("North Team"));
      await screen.findByTestId("booking-schedule-slot-section");
      const confirmEl = screen.getByTestId("booking-schedule-confirm-booking");
      const slotSection = screen.getByTestId("booking-schedule-slot-section");
      const slotBtn = within(slotSection)
        .getAllByRole("button")
        .find((b) => b !== confirmEl)!;
      fireEvent.click(slotBtn);
      await waitFor(() => expect(confirmEl).not.toBeDisabled());
      fireEvent.click(confirmEl);
      await waitFor(() =>
        expect(screen.getByTestId("booking-review-deposit-gate-message")).toHaveTextContent(
          BOOKING_REVIEW_DEPOSIT_SCHEDULE_GATE_MESSAGE,
        ),
      );
      expect(
        screen.getByText(/after payment, you’ll choose your team and arrival time/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/deposit is applied toward your booking/i)).toBeInTheDocument();
      expect(screen.queryByTestId("booking-schedule-team-section")).not.toBeInTheDocument();
      expect(screen.queryByTestId("booking-direction-send")).not.toBeInTheDocument();
      await waitFor(() =>
        expect(screen.getByTestId("deposit-mock-pay")).toBeInTheDocument(),
      );
      expect(postPublicBookingDepositPrepareMock).toHaveBeenCalledTimes(1);
      expect(postPublicBookingDepositPrepareMock).toHaveBeenCalledWith({
        bookingId: "bk_test",
      });
      expect(screen.queryByTestId("booking-schedule-commit-error")).not.toBeInTheDocument();
      const snap = sessionStorage.getItem(BOOKING_CONFIRMATION_SESSION_KEY) ?? "";
      expect(snap).not.toMatch(/client_secret/i);
      for (const call of routerReplace.mock.calls) {
        const url = typeof call[0] === "string" ? call[0] : "";
        expect(url).not.toMatch(/client_secret/i);
      }
    });

    it("payment success after deposit-required 402 finalizes with exact confirm DTO and no schedule loop", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      postPublicBookingConfirmMock
        .mockRejectedValueOnce(
          new PublicBookingPaymentRequiredError({
            kind: "public_booking_deposit_required",
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
            message: "need deposit",
            amountCents: 10000,
            currency: "usd",
            clientSecret: "cs_from_server",
            paymentIntentId: "pi_from_server",
          }),
        )
        .mockResolvedValueOnce({
          kind: "public_booking_confirmation" as const,
          bookingId: "bk_test",
          scheduledStart: "2030-04-15T14:00:00.000Z",
          scheduledEnd: "2030-04-15T16:00:00.000Z",
          status: "confirmed",
          alreadyApplied: false,
        });
      postPublicBookingDepositPrepareMock.mockResolvedValue({
        kind: "public_booking_deposit_prepare",
        bookingId: "bk_test",
        paymentMode: "none",
        classification: "deposit_succeeded",
        publicDepositStatus: "deposit_succeeded",
        paymentIntentId: "pi_from_server",
        nextAction: "finalize_booking",
      });

      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      fireEvent.click(screen.getByText("North Team"));
      await screen.findByTestId("booking-schedule-slot-section");
      const confirmEl = screen.getByTestId("booking-schedule-confirm-booking");
      const slotSection = screen.getByTestId("booking-schedule-slot-section");
      const slotBtn = within(slotSection)
        .getAllByRole("button")
        .find((b) => b !== confirmEl)!;
      fireEvent.click(slotBtn);
      await waitFor(() => expect(confirmEl).not.toBeDisabled());
      fireEvent.click(confirmEl);

      await waitFor(() =>
        expect(screen.getByTestId("deposit-mock-pay")).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByTestId("deposit-mock-pay"));
      fireEvent.click(screen.getByTestId("deposit-mock-pay"));

      await waitFor(() => expect(postPublicBookingConfirmMock).toHaveBeenCalledTimes(2));
      expect(postPublicBookingConfirmMock.mock.calls[1][0]).toEqual({
        bookingId: "bk_test",
        holdId: "hold_test",
      });
      expect(Object.keys(postPublicBookingConfirmMock.mock.calls[1][0]).sort()).toEqual([
        "bookingId",
        "holdId",
      ]);
      expect(screen.queryByTestId("booking-schedule-team-section")).not.toBeInTheDocument();
      await waitFor(() =>
        expect(routerPush).toHaveBeenCalledWith(
          expect.stringMatching(/^\/book\/confirmation\?/),
        ),
      );
      await waitFor(() =>
        expect(screen.queryByTestId("deposit-mock-pay")).not.toBeInTheDocument(),
      );
      expect(sessionStorage.getItem(DEPOSIT_LOCK_KEY)).toBeNull();
      const snap = JSON.parse(
        sessionStorage.getItem(BOOKING_CONFIRMATION_SESSION_KEY) ?? "{}",
      ) as {
        publicDepositPaymentIntentId?: string;
        publicDepositStatus?: string;
        publicDepositHoldId?: string;
        paymentSessionKey?: string;
      };
      expect(snap.publicDepositPaymentIntentId).toBeUndefined();
      expect(snap.publicDepositStatus).toBeUndefined();
      expect(snap.publicDepositHoldId).toBeUndefined();
      expect(snap.paymentSessionKey).toBeUndefined();
    });

    it("schedule confirm 402 without payment details falls back to deposit prepare", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      postPublicBookingDepositPrepareMock
        .mockResolvedValueOnce({
          kind: "public_booking_deposit_prepare",
          bookingId: "bk_test",
          paymentMode: "none",
          classification: "skip_deposit_env",
          nextAction: "finalize_booking",
        })
        .mockResolvedValue({
          kind: "public_booking_deposit_prepare",
          bookingId: "bk_test",
          paymentMode: "deposit",
          classification: "payment_required",
          clientSecret: "cs_from_prepare",
          paymentIntentId: "pi_from_prepare",
          amountCents: 10000,
          nextAction: "confirm_deposit",
        });
      postPublicBookingConfirmMock.mockRejectedValueOnce(
        new PublicBookingPaymentRequiredError({
          kind: "public_booking_deposit_required",
          code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
          message: "need deposit",
          amountCents: 10000,
          currency: "usd",
          clientSecret: null,
        }),
      );
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      fireEvent.click(screen.getByText("North Team"));
      await screen.findByTestId("booking-schedule-slot-section");
      const confirmEl = screen.getByTestId("booking-schedule-confirm-booking");
      const slotSection = screen.getByTestId("booking-schedule-slot-section");
      const slotBtn = within(slotSection)
        .getAllByRole("button")
        .find((b) => b !== confirmEl)!;
      fireEvent.click(slotBtn);
      await waitFor(() => expect(confirmEl).not.toBeDisabled());
      fireEvent.click(confirmEl);

      await waitFor(() =>
        expect(postPublicBookingDepositPrepareMock).toHaveBeenCalledWith({
          bookingId: "bk_test",
          holdId: "hold_test",
        }),
      );
      await waitFor(() =>
        expect(screen.getByTestId("deposit-mock-pay")).toBeInTheDocument(),
      );
      expect(screen.queryByTestId("booking-direction-send")).not.toBeInTheDocument();
      expect(screen.queryByTestId("booking-schedule-commit-error")).not.toBeInTheDocument();
    });

    it("deposit_inconsistent prepare state finalizes instead of waiting for payment", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      postPublicBookingDepositPrepareMock.mockResolvedValue({
        kind: "public_booking_deposit_prepare",
        bookingId: "bk_test",
        paymentMode: "none",
        classification: "deposit_inconsistent",
        publicDepositStatus: "deposit_succeeded",
        nextAction: "finalize_booking",
      });
      postPublicBookingConfirmMock.mockResolvedValueOnce({
        kind: "public_booking_confirmation" as const,
        bookingId: "bk_test",
        scheduledStart: "2030-04-15T14:00:00.000Z",
        scheduledEnd: "2030-04-15T16:00:00.000Z",
        status: "confirmed",
        alreadyApplied: false,
      });
      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      fireEvent.click(screen.getByText("North Team"));
      await screen.findByTestId("booking-schedule-slot-section");
      const confirmEl = screen.getByTestId("booking-schedule-confirm-booking");
      const slotSection = screen.getByTestId("booking-schedule-slot-section");
      const slotBtn = within(slotSection)
        .getAllByRole("button")
        .find((b) => b !== confirmEl)!;
      fireEvent.click(slotBtn);
      await waitFor(() => expect(confirmEl).not.toBeDisabled());
      fireEvent.click(confirmEl);

      await waitFor(() => expect(postPublicBookingConfirmMock).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(routerPush).toHaveBeenCalledWith(
          expect.stringMatching(/^\/book\/confirmation\?/),
        ),
      );
      expect(screen.queryByTestId("deposit-mock-pay")).not.toBeInTheDocument();
    });

    it("failed post-payment finalization preserves booking and hold in recoverable deposit state", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      postPublicBookingConfirmMock
        .mockRejectedValueOnce(
          new PublicBookingPaymentRequiredError({
            kind: "public_booking_deposit_required",
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
            message: "need deposit",
            amountCents: 10000,
            currency: "usd",
            clientSecret: "cs_from_server",
            paymentIntentId: "pi_from_server",
          }),
        )
        .mockRejectedValueOnce(new Error("BOOKING_SLOT_HOLD_EXPIRED"));
      postPublicBookingDepositPrepareMock.mockResolvedValue({
        kind: "public_booking_deposit_prepare",
        bookingId: "bk_test",
        paymentMode: "none",
        classification: "deposit_succeeded",
        publicDepositStatus: "deposit_succeeded",
        paymentIntentId: "pi_from_server",
        nextAction: "finalize_booking",
      });

      render(<BookingFlowClient />);
      await submitFromReviewToSchedule();
      fireEvent.click(screen.getByText("North Team"));
      await screen.findByTestId("booking-schedule-slot-section");
      const confirmEl = screen.getByTestId("booking-schedule-confirm-booking");
      const slotSection = screen.getByTestId("booking-schedule-slot-section");
      const slotBtn = within(slotSection)
        .getAllByRole("button")
        .find((b) => b !== confirmEl)!;
      fireEvent.click(slotBtn);
      await waitFor(() => expect(confirmEl).not.toBeDisabled());
      fireEvent.click(confirmEl);

      await waitFor(() =>
        expect(screen.getByTestId("deposit-mock-pay")).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByTestId("deposit-mock-pay"));

      await waitFor(() =>
        expect(screen.getByText("BOOKING_SLOT_HOLD_EXPIRED")).toBeInTheDocument(),
      );
      expect(screen.getByTestId("booking-deposit-check-status")).toBeInTheDocument();
      expect(screen.queryByTestId("booking-schedule-team-section")).not.toBeInTheDocument();
      const snap = JSON.parse(
        sessionStorage.getItem(BOOKING_CONFIRMATION_SESSION_KEY) ?? "{}",
      ) as { bookingId?: string; publicDepositHoldId?: string };
      expect(snap.bookingId).toBe("bk_test");
      expect(snap.publicDepositHoldId).toBe("hold_test");
    });

    it("resumes finalization after Stripe redirects back with booking and hold ids", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchString()}&publicBookingPayment=1&bookingId=bk_test&holdId=hold_test&redirect_status=succeeded`,
      );

      render(<BookingFlowClient />);

      await waitFor(() =>
        expect(postPublicBookingConfirmMock).toHaveBeenCalledWith(
          { bookingId: "bk_test", holdId: "hold_test" },
          null,
        ),
      );
      await waitFor(() =>
        expect(routerPush).toHaveBeenCalledWith(
          expect.stringMatching(/^\/book\/confirmation\?/),
        ),
      );
    });

    it("refresh after payment success restores hold id from session and finalizes", async () => {
      const raw = {
        v: 1,
        savedAt: Date.now(),
        intakeId: "intake_test",
        bookingId: "bk_test",
        priceCents: null,
        durationMinutes: null,
        confidence: null,
        bookingErrorCode: "",
        publicDepositHoldId: "hold_test",
        publicDepositPaymentIntentId: "pi_test",
        selectedTeamId: "fo_test_pick",
        selectedTeamDisplayName: "North Team",
        selectedSlotStart: "2030-04-15T14:00:00.000Z",
        selectedSlotEnd: "2030-04-15T16:00:00.000Z",
      };
      sessionStorage.setItem(BOOKING_CONFIRMATION_SESSION_KEY, JSON.stringify(raw));
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchString()}&publicBookingPayment=1&bookingId=bk_test&redirect_status=succeeded`,
      );

      render(<BookingFlowClient />);

      await waitFor(() =>
        expect(postPublicBookingConfirmMock).toHaveBeenCalledWith(
          { bookingId: "bk_test", holdId: "hold_test" },
          null,
        ),
      );
      await waitFor(() =>
        expect(routerPush).toHaveBeenCalledWith(
          expect.stringMatching(/^\/book\/confirmation\?/),
        ),
      );
    });

    it("redirect payment without hold id syncs deposit and advances to schedule", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchString()}&publicBookingPayment=1&bookingId=bk_test&redirect_status=succeeded`,
      );
      postPublicBookingDepositPrepareMock.mockResolvedValue({
        kind: "public_booking_deposit_prepare",
        bookingId: "bk_test",
        paymentMode: "none",
        classification: "deposit_succeeded",
        publicDepositStatus: "deposit_succeeded",
        paymentIntentId: "pi_test",
        nextAction: "finalize_booking",
      });

      render(<BookingFlowClient />);

      await waitFor(() =>
        expect(screen.getByTestId("booking-schedule-team-section")).toBeInTheDocument(),
      );
      expect(postPublicBookingConfirmMock).not.toHaveBeenCalled();
    });

    it("redirect payment without hold id does not re-render payment when resume still asks for confirmation", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `${buildReviewSearchString()}&publicBookingPayment=1&bookingId=bk_test&redirect_status=succeeded`,
      );
      postPublicBookingDepositPrepareMock.mockResolvedValue({
        kind: "public_booking_deposit_prepare",
        bookingId: "bk_test",
        paymentMode: "deposit",
        classification: "payment_required",
        clientSecret: "cs_should_not_confirm_again",
        paymentIntentId: "pi_test",
        amountCents: 10000,
        nextAction: "confirm_deposit",
      });

      render(<BookingFlowClient />);

      await waitFor(() => expect(postPublicBookingDepositPrepareMock).toHaveBeenCalledTimes(1));
      expect(postPublicBookingDepositPrepareMock).toHaveBeenCalledWith({
        bookingId: "bk_test",
      });
      expect(screen.queryByTestId("deposit-mock-pay")).not.toBeInTheDocument();
      expect(postPublicBookingConfirmMock).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          "Payment succeeded, but we could not safely resume the booking. Please contact support before retrying.",
        ),
      ).toBeInTheDocument();
    });
  });
});
