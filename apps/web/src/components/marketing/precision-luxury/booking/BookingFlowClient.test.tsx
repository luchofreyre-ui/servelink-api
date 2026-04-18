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
  BOOKING_PUBLIC_CARD_FIRST_TIME_TITLE,
  BOOKING_PUBLIC_CARD_MOVE_TITLE,
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
  BOOKING_HOME_CONDITION_LABELS,
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
  BOOKING_REVIEW_SCOPE_OF_WORK_LABEL,
  BOOKING_SURFACE_COMPLEXITY_LABELS,
  BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD,
  BOOKING_REVIEW_SUBMIT_TRY_AGAIN,
  BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_REFRESHING,
  BOOKING_REVIEW_SEE_AVAILABLE_TEAMS_CTA,
  BOOKING_REVIEW_STEP_TITLE,
  BOOKING_REVIEW_TRANSITION_SETUP_LABEL,
  BOOKING_SCOPE_INTENSITY_LABELS,
  BOOKING_SCHEDULE_CHOOSE_SLOT_HINT,
  BOOKING_SCHEDULE_CHOOSE_TEAM_TITLE,
  BOOKING_SCHEDULE_CONFIRM_BOOKING_CTA,
  BOOKING_SCHEDULE_CONFIRM_FAILED,
  BOOKING_SCHEDULE_HOLD_FAILED,
  BOOKING_SCHEDULE_NO_SLOTS_FOR_TEAM_TITLE,
  BOOKING_SCHEDULE_SLOTS_TITLE,
  BOOKING_SCHEDULE_SUMMARY_TITLE,
  BOOKING_SCHEDULE_ZERO_TEAMS_TITLE,
  BOOKING_TRANSITION_STATE_LABELS,
} from "./bookingPublicSurfaceCopy";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import { BOOKING_BEDROOMS_FIELD_LABEL } from "./bookingEstimateFactorFields";
import {
  bookingServiceCatalog,
  getBookingDefaultServiceId,
  getBookingServiceCatalogItem,
} from "./bookingServiceCatalog";

const phase4ServiceIds = {
  deep: bookingServiceCatalog.find((s) => s.slug === "deep-cleaning")!.id,
  move: bookingServiceCatalog.find((s) => s.slug === "move-in-move-out")!.id,
};
import {
  BOOKING_CONFIRMATION_SESSION_KEY,
  BOOKING_FLOW_FRESH_START_FLAG,
  markBookingFlowFreshStartRequested,
} from "./bookingUrlState";
import { BookingFlowClient } from "./BookingFlowClient";

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
  const zipInput = screen.getByLabelText(
    /^service zip code$/i,
  ) as HTMLInputElement;
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
    return {
      kind: "public_booking_team_availability" as const,
      bookingId: body.bookingId,
      selectedTeam: {
        id: body.foId,
        displayName: isSouth ? "South Team" : "North Team",
      },
      windows: [
        {
          foId: body.foId,
          foDisplayName: isSouth ? "South Team" : "North Team",
          startAt: isSouth
            ? "2030-04-16T10:00:00.000Z"
            : "2030-04-15T14:00:00.000Z",
          endAt: isSouth
            ? "2030-04-16T12:00:00.000Z"
            : "2030-04-15T16:00:00.000Z",
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
  return `step=review&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday&locZip=94103&service=${encodeURIComponent(
    svc,
  )}${dc}`;
}

function buildIncompleteHomeStepSearchString(): string {
  const svc = getBookingDefaultServiceId();
  const dc = isDeepCleaningBookingServiceId(svc) ? "&dcProgram=single_visit" : "";
  return `step=home&homeSize=&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday&service=${encodeURIComponent(
    svc,
  )}${dc}`;
}

/** Home is structurally complete but cadence (frequency / preferred time) is missing. */
function buildIncompleteCadenceHomeSearchString(): string {
  const svc = getBookingDefaultServiceId();
  const dc = isDeepCleaningBookingServiceId(svc) ? "&dcProgram=single_visit" : "";
  return `step=home&homeSize=2000&bedrooms=2&bathrooms=2&pets=&service=${encodeURIComponent(
    svc,
  )}${dc}`;
}

function buildReviewSearchStringForService(serviceId: string): string {
  const dc = isDeepCleaningBookingServiceId(serviceId)
    ? "&dcProgram=single_visit"
    : "";
  return `step=review&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday&locZip=94103&service=${encodeURIComponent(
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
    postPublicBookingAvailabilityMock.mockClear();
    postPublicBookingHoldMock.mockClear();
    postPublicBookingConfirmMock.mockClear();
    emitBookingFunnelEventMock.mockClear();
    sessionStorage.removeItem(BOOKING_CONFIRMATION_SESSION_KEY);
    sessionStorage.removeItem(BOOKING_FLOW_FRESH_START_FLAG);
  });

  afterEach(() => {
    cleanup();
    sessionStorage.removeItem(BOOKING_CONFIRMATION_SESSION_KEY);
    sessionStorage.removeItem(BOOKING_FLOW_FRESH_START_FLAG);
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

    it("hold failure shows copy, keeps selection, and refetches team windows", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      submitBookingDirectionIntakeMock.mockResolvedValue(submitSuccess);
      postPublicBookingHoldMock.mockRejectedValueOnce(new Error("slot gone"));
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
      const availabilityCallsBefore = postPublicBookingAvailabilityMock.mock.calls.filter(
        (c) => (c[0] as { foId?: string }).foId === "fo_test_pick",
      ).length;
      fireEvent.click(confirmEl);
      await waitFor(() =>
        expect(screen.getByTestId("booking-schedule-commit-error")).toHaveTextContent(
          BOOKING_SCHEDULE_HOLD_FAILED,
        ),
      );
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
    it("shows the three public service cards", () => {
      bookingFlowTestSearch.sp = new URLSearchParams("step=service");
      render(<BookingFlowClient />);
      const root = screen.getByTestId("booking-public-service-options");
      expect(within(root).getByText(BOOKING_PUBLIC_CARD_FIRST_TIME_TITLE)).toBeInTheDocument();
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

    it("selecting first-time allows Continue to home details", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams("step=service");
      render(<BookingFlowClient />);
      const options = screen.getByTestId("booking-public-service-options");
      fireEvent.click(within(options).getByText(BOOKING_PUBLIC_CARD_FIRST_TIME_TITLE));
      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
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
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { level: 2, name: "Tell us about your home" }),
        ).toBeInTheDocument(),
      );
    });

    it("advances home → service location before review (ZIP gate)", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        `step=home&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday&service=${encodeURIComponent(
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

      const continueBtn = screen.getByRole("button", { name: /^continue$/i });
      fireEvent.click(continueBtn);
      fireEvent.click(continueBtn);
      fireEvent.change(screen.getByLabelText(/^service zip code$/i), {
        target: { value: "94103" },
      });
      fireEvent.click(continueBtn);

      await waitFor(() =>
        expect(screen.getByText(BOOKING_REVIEW_STEP_TITLE)).toBeInTheDocument(),
      );

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(within(homeBlock).getByText("2000")).toBeInTheDocument();
      expect(within(homeBlock).getByText(/Cat family/i)).toBeInTheDocument();

      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(
        within(scheduleBlock).getByText(/One-time \(public booking\)/i),
      ).toBeInTheDocument();
      expect(within(scheduleBlock).getByText("Friday")).toBeInTheDocument();

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
    function buildHomeStepSearchStringForCadence(): string {
      const svc = getBookingDefaultServiceId();
      const dc = isDeepCleaningBookingServiceId(svc) ? "&dcProgram=single_visit" : "";
      return `step=home&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday&service=${encodeURIComponent(
        svc,
      )}${dc}`;
    }

    it("changing preferred time on home then continuing to review sends preview with the new timing", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildHomeStepSearchStringForCadence(),
      );
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      const cadenceSection = screen.getByTestId("booking-home-cadence-section");
      fireEvent.click(
        within(cadenceSection).getByRole("radio", { name: /^Saturday\b/i }),
      );

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { preferredTime?: string }).preferredTime === "Saturday",
          ),
        ).toBe(true),
      );
    });

    it("from review, backing to home, changing preferred window, then returning preserves home and uses One-Time intake frequency", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan();

      goHomeFromReviewViaBackOnce();

      const cadenceSection = screen.getByTestId("booking-home-cadence-section");
      fireEvent.click(
        within(cadenceSection).getByRole("radio", { name: /^Saturday\b/i }),
      );

      await continueThroughLocationGateToReview();

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(within(homeBlock).getByText("2000")).toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { frequency?: string }).frequency === "One-Time" &&
              (call[0] as { preferredTime?: string }).preferredTime === "Saturday",
          ),
        ).toBe(true),
      );
    });

    it("backing out of review during a stuck submit leaves home cadence editable (no review send control)", async () => {
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

      const cadenceSection = screen.getByTestId("booking-home-cadence-section");
      fireEvent.click(
        within(cadenceSection).getByRole("radio", { name: /^Saturday\b/i }),
      );
    });
  });

  describe("home detail change", () => {
    function buildHomeStepSearchString(): string {
      const svc = getBookingDefaultServiceId();
      const dc = isDeepCleaningBookingServiceId(svc) ? "&dcProgram=single_visit" : "";
      return `step=home&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday&service=${encodeURIComponent(
        svc,
      )}${dc}`;
    }

    it("from review, home size edit preserves schedule; preview uses new home size", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();

      fireEvent.change(screen.getByLabelText(/^home size$/i), {
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
      expect(within(scheduleBlock).getByText("Friday")).toBeInTheDocument();

      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(within(homeBlock).getByText("2400")).toBeInTheDocument();

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

      fireEvent.change(screen.getByLabelText(/^home size$/i), {
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

      fireEvent.change(screen.getByLabelText(/pets \(optional\)/i), {
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

      fireEvent.change(screen.getByLabelText(/^home size$/i), {
        target: { value: "2600" },
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
      expect(within(scheduleBlock).getByText("Friday")).toBeInTheDocument();

      const homeBlock = within(reviewRoot)
        .getByText("Home details")
        .closest("div.rounded-2xl")!;
      expect(within(homeBlock).getByText("2000")).toBeInTheDocument();

      const serviceTitle = getBookingServiceCatalogItem(
        getBookingDefaultServiceId(),
      ).title;
      const serviceBlock = within(reviewRoot)
        .getByText("Service")
        .closest("div.rounded-2xl")!;
      expect(within(serviceBlock).getByText(serviceTitle)).toBeInTheDocument();
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
      expect(within(homeBlock).getByText("2000")).toBeInTheDocument();
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
          "Please complete your home details and preferred arrival window before continuing.",
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
          "Please complete your home details and preferred arrival window before continuing.",
        ),
      ).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/^home size$/i), {
        target: { value: "2200" },
      });

      await waitFor(() =>
        expect(
          screen.queryByText(
            "Please complete your home details and preferred arrival window before continuing.",
          ),
        ).not.toBeInTheDocument(),
      );

      expect(continueBtn).toHaveAttribute("aria-invalid", "false");
      expect(continueBtn).not.toHaveAttribute("aria-describedby");

      await continueThroughLocationGateToReview();
    });

    it("invalid Continue from home does not advance when cadence is incomplete", () => {
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
          "Please complete your home details and preferred arrival window before continuing.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", {
          level: 2,
          name: BOOKING_REVIEW_STEP_TITLE,
        }),
      ).not.toBeInTheDocument();

      expect(screen.getByText(/2000/)).toBeInTheDocument();
    });

    it("after an invalid home Continue with missing preferred window, choosing Saturday clears stale attempt UI and reaches review", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(
        buildIncompleteCadenceHomeSearchString(),
      );
      render(<BookingFlowClient />);

      fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

      expect(
        screen.getByText(
          "Please complete your home details and preferred arrival window before continuing.",
        ),
      ).toBeInTheDocument();

      const cadenceSection = screen.getByTestId("booking-home-cadence-section");
      fireEvent.click(
        within(cadenceSection).getByRole("radio", { name: /^Saturday\b/i }),
      );

      await waitFor(() =>
        expect(
          screen.queryByText(
            "Please complete your home details and preferred arrival window before continuing.",
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
          "Please complete your home details and preferred arrival window before continuing.",
        ),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /^back$/i }));

      expect(
        screen.queryByText(
          "Please complete your home details and preferred arrival window before continuing.",
        ),
      ).not.toBeInTheDocument();

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Choose your service",
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

      fireEvent.change(screen.getByLabelText(/pets \(optional\)/i), {
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

    it("review Home details shows comma-stripped home size matching submit normalization", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();

      fireEvent.change(screen.getByLabelText(/^home size$/i), {
        target: { value: "3,100" },
      });

      await continueThroughLocationGateToReview();

      const homeBlock = reviewHomeDetailsSection();
      expect(within(homeBlock).getByText("3100")).toBeInTheDocument();
      expect(within(homeBlock).queryByText(/3,100/)).not.toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some(
            (call) =>
              call[0] &&
              typeof call[0] === "object" &&
              (call[0] as { homeSize?: string }).homeSize === "3100",
          ),
        ).toBe(true),
      );
    });

    it("review schedule shows Saturday after changing preferred window on home", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();

      const cadenceSection = screen.getByTestId("booking-home-cadence-section");
      fireEvent.click(
        within(cadenceSection).getByRole("radio", { name: /^Saturday\b/i }),
      );

      await continueThroughLocationGateToReview();

      const reviewRoot = screen
        .getByRole("heading", { name: BOOKING_REVIEW_STEP_TITLE })
        .closest("section")!;
      const scheduleBlock = within(reviewRoot)
        .getByText("Schedule")
        .closest("div.rounded-2xl")!;
      expect(within(scheduleBlock).getByText("Saturday")).toBeInTheDocument();
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
      expect(screen.queryByText("Deep clean plan:")).not.toBeInTheDocument();
    });

    it("deep-cleaning service review includes deep clean plan summary", async () => {
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
        expect(screen.getByText("Deep clean plan:")).toBeInTheDocument(),
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

      fireEvent.click(
        screen.getByRole("radio", { name: /heavy buildup/i }),
      );

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

      fireEvent.click(screen.getByRole("button", { name: /^kitchen grease$/i }));
      fireEvent.click(screen.getByRole("button", { name: /^bathroom buildup$/i }));

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.problemAreas == null &&
              ef?.kitchenCondition === "heavy_grease" &&
              ef?.bathroomCondition === "heavy_scale"
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

      fireEvent.click(screen.getByRole("radio", { name: /dense layout/i }));

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.surfaceComplexity == null && ef?.floorVisibility === "lots_of_items"
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

      fireEvent.click(screen.getByRole("radio", { name: /light upkeep/i }));
      fireEvent.click(screen.getByRole("button", { name: /^pet hair$/i }));
      fireEvent.click(screen.getByRole("radio", { name: /minimal furnishings/i }));

      await continueThroughLocationGateToReview();

      const homeBlock = reviewHomeDetailsSection();
      expect(within(homeBlock).getByText("Light upkeep")).toBeInTheDocument();
      expect(within(homeBlock).getByText("Pet hair")).toBeInTheDocument();
      expect(within(homeBlock).getByText("Minimal furnishings")).toBeInTheDocument();
    });

    it("changing condition from review path preserves schedule and triggers a fresh preview", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(
        screen.getByRole("radio", { name: /move-in \/ move-out reset/i }),
      );

      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return p.condition == null && ef?.occupancyState === "vacant";
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
      expect(within(scheduleBlock).getByText("Friday")).toBeInTheDocument();
    });
  });

  describe("estimator depth phase 2 — preview transparency", () => {
    it("shows heavy-condition driver bullet when condition is heavy buildup", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(screen.getByRole("radio", { name: /heavy buildup/i }));
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
      fireEvent.click(screen.getByRole("button", { name: /heavy dust/i }));
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
      fireEvent.click(screen.getByRole("radio", { name: /dense layout/i }));
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

      fireEvent.click(
        screen.getByRole("radio", { name: BOOKING_SCOPE_INTENSITY_LABELS.detail_heavy }),
      );
      await continueThroughLocationGateToReview();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.scopeIntensity == null && ef?.firstTimeWithServelink === "yes"
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
      fireEvent.click(
        screen.getByRole("radio", { name: BOOKING_SCOPE_INTENSITY_LABELS.targeted_touch_up }),
      );
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
      expect(
        within(homeBlock).getByText(BOOKING_SCOPE_INTENSITY_LABELS.targeted_touch_up),
      ).toBeInTheDocument();
      expect(
        within(homeBlock).getByText(BOOKING_ADD_ON_LABELS.baseboards_detail),
      ).toBeInTheDocument();
      expect(within(homeBlock).getByText(`${BOOKING_REVIEW_SCOPE_OF_WORK_LABEL}:`)).toBeInTheDocument();
    });

    it("driver block shows detail-heavy and add-on bullets when relevant", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      goHomeFromReviewViaBackOnce();
      fireEvent.click(
        screen.getByRole("radio", { name: BOOKING_SCOPE_INTENSITY_LABELS.detail_heavy }),
      );
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
      fireEvent.click(
        screen.getByRole("radio", { name: BOOKING_SCOPE_INTENSITY_LABELS.detail_heavy }),
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

    it("changing scope from review path preserves schedule summary", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      previewEstimateMock.mockClear();
      render(<BookingFlowClient />);

      await fillReviewContactAndOptionalFirstTimePlan(5000);

      previewEstimateMock.mockClear();
      goHomeFromReviewViaBackOnce();

      fireEvent.click(
        screen.getByRole("radio", { name: BOOKING_SCOPE_INTENSITY_LABELS.targeted_touch_up }),
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
      expect(within(scheduleBlock).getByText("Friday")).toBeInTheDocument();

      await waitFor(() =>
        expect(
          previewEstimateMock.mock.calls.some((call) => {
            const p = call[0] as Record<string, unknown>;
            const ef = p.estimateFactors as Record<string, unknown> | undefined;
            return (
              p.scopeIntensity == null &&
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
      expect(within(scheduleBlock).getByText("Friday")).toBeInTheDocument();

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
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_SURFACE_COMPLEXITY_LABELS.dense_layout,
        }),
      );
      await continueThroughLocationGateToReview();
      await waitFor(
        () =>
          expect(screen.getByText(BOOKING_REVIEW_PRE_CONF_CUSTOM_HEADLINE)).toBeInTheDocument(),
        { timeout: 5000 },
      );
    });

    it("heavier combined signals show special-attention band copy", async () => {
      bookingFlowTestSearch.sp = new URLSearchParams(buildReviewSearchString());
      render(<BookingFlowClient />);
      await fillReviewContactAndOptionalFirstTimePlan(5000);
      goHomeFromReviewViaBackOnce();
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_HOME_CONDITION_LABELS.heavy_buildup,
        }),
      );
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_SURFACE_COMPLEXITY_LABELS.dense_layout,
        }),
      );
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_SCOPE_INTENSITY_LABELS.detail_heavy,
        }),
      );
      await continueThroughLocationGateToReview();
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
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_SURFACE_COMPLEXITY_LABELS.minimal_furnishings,
        }),
      );
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
      fireEvent.click(
        screen.getByRole("radio", {
          name: BOOKING_SURFACE_COMPLEXITY_LABELS.dense_layout,
        }),
      );
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
});
