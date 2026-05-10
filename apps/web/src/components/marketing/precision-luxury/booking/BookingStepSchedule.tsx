import { BookingOptionCard } from "../BookingOptionCard";
import { BookingSectionCard } from "../BookingSectionCard";
import {
  BOOKING_SCHEDULE_CHOOSE_DIFFERENT_TIME_CTA,
  BOOKING_SCHEDULE_CHOOSE_SLOT_HINT,
  BOOKING_SCHEDULE_CHOOSE_TEAM_HINT,
  BOOKING_SCHEDULE_CHOOSE_TEAM_TITLE,
  BOOKING_SCHEDULE_CLEANING_EFFORT_EXPLAINER,
  BOOKING_SCHEDULE_CLEANING_EFFORT_LABEL,
  BOOKING_SCHEDULE_CONFIRM_BOOKING_CTA,
  BOOKING_SCHEDULE_CONFIRMING,
  BOOKING_SCHEDULE_DURATION_CONTEXT_TITLE,
  BOOKING_SCHEDULE_FIRST_VISIT_TIME_EXPLAINER,
  BOOKING_SCHEDULE_FIRST_VISIT_TIME_TITLE,
  BOOKING_SCHEDULE_HOLD_FAILED_HINT,
  BOOKING_SCHEDULE_IN_HOME_FALLBACK,
  BOOKING_SCHEDULE_IN_HOME_LOADING,
  BOOKING_SCHEDULE_IN_HOME_TIME_LABEL,
  BOOKING_SCHEDULE_NO_SLOTS_BACK_TO_REVIEW_CTA,
  BOOKING_SCHEDULE_NO_SLOTS_FOR_TEAM_BODY,
  BOOKING_SCHEDULE_NO_SLOTS_FOR_TEAM_TITLE,
  BOOKING_SCHEDULE_NO_SLOTS_TRY_OTHER_TEAM_CTA,
  BOOKING_SCHEDULE_PAGE_LEAD,
  BOOKING_SCHEDULE_PAGE_TITLE,
  BOOKING_SCHEDULE_PARALLELIZATION_NOTE,
  BOOKING_SCHEDULE_RECOMMENDED_BADGE,
  BOOKING_SCHEDULE_RETRY_CONFIRM_CTA,
  BOOKING_SCHEDULE_SLOTS_LEAD,
  BOOKING_SCHEDULE_SLOT_CARD_BODY,
  BOOKING_SCHEDULE_SUMMARY_ARRIVAL_LABEL,
  BOOKING_SCHEDULE_SUMMARY_TEAM_LABEL,
  BOOKING_SCHEDULE_SUMMARY_TITLE,
  BOOKING_SCHEDULE_TEAM_CARD_BODY,
  BOOKING_SCHEDULE_TEAM_CARD_RECOMMENDED_BODY,
  BOOKING_SCHEDULE_TEAM_SUPPORT_LINE,
  BOOKING_SCHEDULE_TEAMS_LOADING,
  BOOKING_SCHEDULE_TEAMS_LOADING_STILL,
  BOOKING_SCHEDULE_TEAMS_LOAD_FAILED_BODY,
  BOOKING_SCHEDULE_TEAMS_LOAD_FAILED_TITLE,
  BOOKING_SCHEDULE_LOCATION_UNRESOLVED_BODY,
  BOOKING_SCHEDULE_LOCATION_UNRESOLVED_TITLE,
  BOOKING_SCHEDULE_WINDOWS_LOADING,
  BOOKING_SCHEDULE_WINDOWS_LOADING_STILL,
  BOOKING_SCHEDULE_ZERO_TEAMS_ADJUST_CTA,
  BOOKING_SCHEDULE_ZERO_TEAMS_BODY,
  BOOKING_SCHEDULE_ZERO_TEAMS_CONTINUE_CTA,
  BOOKING_SCHEDULE_ZERO_TEAMS_TITLE,
  BOOKING_STEP_EDIT_CONTINUITY_HINT,
  bookingScheduleTeamSizeAssumptionCopy,
} from "./bookingPublicSurfaceCopy";
import type { BookingAvailableTeamOption, BookingFlowState } from "./bookingFlowTypes";
import {
  formatApproximateInHomeDurationMinutes,
  formatEstimateDurationMinutes,
} from "./bookingIntakePreviewDisplay";

export type BookingScheduleTeamDurationContext = {
  teamId: string;
  assignedCrewSize: number | null;
  estimatedInHomeMinutes: number | null;
};

export type DerivedSchedulePreview = {
  visit1: Date;
  visit2: Date;
  visit3: Date;
  recurringStart: Date;
};

export type BookingScheduleTeamsEmptyState =
  | "none"
  | "zero"
  | "load_error"
  | "location_unresolved";

function formatSlotLabel(isoStart: string): string {
  const d = new Date(isoStart);
  if (!Number.isFinite(d.getTime())) return isoStart;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatArrivalWindow(startAt: string, endAt: string): string {
  const startLabel = formatSlotLabel(startAt);
  const end = new Date(endAt);
  if (!Number.isFinite(end.getTime())) return `${startLabel} – ${endAt}`;
  const endPart = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${startLabel} – ${endPart}`;
}

function formatSchedulePreviewDate(d: Date): string {
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type BookingStepScheduleProps = {
  state: BookingFlowState;
  serviceId: string;
  teamsLoading: boolean;
  windowsLoading: boolean;
  confirmLoading: boolean;
  /** Team / slot list load failures (not hold/confirm). */
  surfaceError: string | null;
  teamsEmptyState: BookingScheduleTeamsEmptyState;
  teamsLoadSlowHint: boolean;
  windowsLoadSlowHint: boolean;
  slotsEmptyForSelectedTeam: boolean;
  scheduleCommitError: string | null;
  scheduleCommitPhase: "none" | "hold_failed" | "confirm_failed";
  hasAlternateTeamToSwitchTo: boolean;
  onSelectTeam: (team: BookingAvailableTeamOption) => void;
  onSelectSlot: (slotId: string | undefined, startAt: string, endAt: string) => void;
  onConfirmArrival: () => void;
  onAdjustScheduleDetails: () => void;
  onContinueManualFollowUp: () => void;
  onBackToReviewFromSchedule: () => void;
  onSwitchToAlternateTeam: () => void;
  onRetryConfirmBooking: () => void;
  onChooseDifferentTimeAfterConfirmFail: () => void;
  schedulePreview: DerivedSchedulePreview | null;
  /** Labor-time estimate from the same preview the customer saw on review (not re-derived). */
  laborEffortMinutes: number | null;
  /** Team-contextual in-home planning from `public_booking_team_availability.selectedTeam`. */
  scheduleTeamDurationContext: BookingScheduleTeamDurationContext | null;
};

export function BookingStepSchedule({
  state,
  serviceId: _serviceId,
  teamsLoading,
  windowsLoading,
  confirmLoading,
  surfaceError,
  teamsEmptyState,
  teamsLoadSlowHint,
  windowsLoadSlowHint,
  slotsEmptyForSelectedTeam,
  scheduleCommitError,
  scheduleCommitPhase,
  hasAlternateTeamToSwitchTo,
  onSelectTeam,
  onSelectSlot,
  onConfirmArrival,
  onAdjustScheduleDetails,
  onContinueManualFollowUp,
  onBackToReviewFromSchedule,
  onSwitchToAlternateTeam,
  onRetryConfirmBooking,
  onChooseDifferentTimeAfterConfirmFail,
  schedulePreview,
  laborEffortMinutes,
  scheduleTeamDurationContext,
}: BookingStepScheduleProps) {
  void _serviceId;
  const displayTeams = state.availableTeams.slice(0, 2);
  const hasTeams = displayTeams.length > 0;
  const teamChosen = Boolean(state.selectedTeamId.trim());
  const selectedTeamIdTrim = state.selectedTeamId.trim();
  const contextMatchesTeam =
    Boolean(selectedTeamIdTrim) &&
    scheduleTeamDurationContext?.teamId === selectedTeamIdTrim;
  const selectedSlotId = state.selectedSlotId.trim();
  const selectedSlotIsCurrent =
    Boolean(selectedSlotId) &&
    state.availableWindows.some((w) => w.slotId?.trim() === selectedSlotId);
  const slotChosen =
    selectedSlotIsCurrent &&
    Boolean(state.selectedSlotStart.trim()) &&
    Boolean(state.selectedSlotEnd.trim());
  const canConfirm =
    teamChosen &&
    slotChosen &&
    scheduleCommitPhase !== "confirm_failed" &&
    !windowsLoading &&
    !confirmLoading;
  const showTeamsFallback =
    !teamsLoading && teamsEmptyState !== "none" && !hasTeams;

  return (
    <BookingSectionCard
      eyebrow="Step 5"
      title={BOOKING_SCHEDULE_PAGE_TITLE}
      body={BOOKING_SCHEDULE_PAGE_LEAD}
    >
      <p className="mb-8 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B] md:mb-10">
        {BOOKING_STEP_EDIT_CONTINUITY_HINT}
      </p>

      {surfaceError && teamsEmptyState === "none" ? (
        <p className="mb-6 rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 font-[var(--font-manrope)] text-sm text-amber-950">
          {surfaceError}
        </p>
      ) : null}

      {showTeamsFallback ? (
        <div
          data-testid="booking-schedule-zero-teams-fallback"
          className="mb-8 rounded-2xl border border-[#C9B27C]/20 bg-white px-6 py-8 shadow-sm ring-1 ring-[#C9B27C]/10"
        >
          <p className="font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">
            {teamsEmptyState === "load_error"
              ? BOOKING_SCHEDULE_TEAMS_LOAD_FAILED_TITLE
              : teamsEmptyState === "location_unresolved"
                ? BOOKING_SCHEDULE_LOCATION_UNRESOLVED_TITLE
                : BOOKING_SCHEDULE_ZERO_TEAMS_TITLE}
          </p>
          <p className="mt-3 max-w-2xl font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
            {teamsEmptyState === "load_error"
              ? BOOKING_SCHEDULE_TEAMS_LOAD_FAILED_BODY
              : teamsEmptyState === "location_unresolved"
                ? BOOKING_SCHEDULE_LOCATION_UNRESOLVED_BODY
                : BOOKING_SCHEDULE_ZERO_TEAMS_BODY}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              data-testid="booking-schedule-adjust-details"
              onClick={() => onAdjustScheduleDetails()}
              className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-8 py-3.5 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76]"
            >
              {BOOKING_SCHEDULE_ZERO_TEAMS_ADJUST_CTA}
            </button>
            {teamsEmptyState === "zero" || teamsEmptyState === "location_unresolved" ? (
              <button
                type="button"
                data-testid="booking-schedule-continue-manual"
                onClick={() => onContinueManualFollowUp()}
                className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/28 px-8 py-3.5 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-white"
              >
                {BOOKING_SCHEDULE_ZERO_TEAMS_CONTINUE_CTA}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Section A — team selection */}
      {!showTeamsFallback ? (
        <div data-testid="booking-schedule-team-section">
          <p className="font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">
            {BOOKING_SCHEDULE_CHOOSE_TEAM_TITLE}
          </p>
          <p className="mt-2 max-w-2xl font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
            {BOOKING_SCHEDULE_TEAM_SUPPORT_LINE}
          </p>

          <div className="mt-6">
            {teamsLoading && !hasTeams ? (
              <div data-testid="booking-schedule-teams-loading">
                <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
                  {BOOKING_SCHEDULE_TEAMS_LOADING}
                </p>
                {teamsLoadSlowHint ? (
                  <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#64748B]">
                    {BOOKING_SCHEDULE_TEAMS_LOADING_STILL}
                  </p>
                ) : null}
              </div>
            ) : !hasTeams ? null : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {displayTeams.map((team) => (
                    <BookingOptionCard
                      key={team.id}
                      title={team.displayName}
                      body={
                        team.isRecommended
                          ? BOOKING_SCHEDULE_TEAM_CARD_RECOMMENDED_BODY
                          : BOOKING_SCHEDULE_TEAM_CARD_BODY
                      }
                      meta={
                        team.isRecommended ? BOOKING_SCHEDULE_RECOMMENDED_BADGE : undefined
                      }
                      selected={state.selectedTeamId.trim() === team.id}
                      onClick={() => onSelectTeam(team)}
                    />
                  ))}
                </div>
                {!teamChosen ? (
                  <p className="mt-4 font-[var(--font-manrope)] text-sm text-[#64748B]">
                    {BOOKING_SCHEDULE_CHOOSE_TEAM_HINT}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      {!showTeamsFallback && teamChosen ? (
        <div
          data-testid="booking-schedule-duration-context"
          className="mt-10 rounded-2xl border border-[#C9B27C]/18 bg-[#FFFCF8] px-5 py-4 shadow-sm ring-1 ring-[#C9B27C]/10"
        >
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            {BOOKING_SCHEDULE_DURATION_CONTEXT_TITLE}
          </p>
          {laborEffortMinutes != null && Number.isFinite(laborEffortMinutes) ? (
            <>
              <p className="mt-3 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                <span className="text-[#64748B]">
                  {BOOKING_SCHEDULE_CLEANING_EFFORT_LABEL}:
                </span>{" "}
                {formatEstimateDurationMinutes(laborEffortMinutes)}
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                {BOOKING_SCHEDULE_CLEANING_EFFORT_EXPLAINER}
              </p>
            </>
          ) : null}
          <p className="mt-4 font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">
            {BOOKING_SCHEDULE_IN_HOME_TIME_LABEL}
          </p>
          {windowsLoading ? (
            <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              {BOOKING_SCHEDULE_IN_HOME_LOADING}
            </p>
          ) : contextMatchesTeam &&
            scheduleTeamDurationContext?.estimatedInHomeMinutes != null &&
            Number.isFinite(scheduleTeamDurationContext.estimatedInHomeMinutes) ? (
            <>
              <p
                className="mt-2 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]"
                data-testid="booking-schedule-in-home-duration"
              >
                {formatApproximateInHomeDurationMinutes(
                  scheduleTeamDurationContext.estimatedInHomeMinutes,
                )}
              </p>
              {scheduleTeamDurationContext.assignedCrewSize != null &&
              Number.isFinite(scheduleTeamDurationContext.assignedCrewSize) ? (
                <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                  {bookingScheduleTeamSizeAssumptionCopy(
                    scheduleTeamDurationContext.assignedCrewSize,
                  )}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              {BOOKING_SCHEDULE_IN_HOME_FALLBACK}
            </p>
          )}
          <p className="mt-3 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
            {BOOKING_SCHEDULE_PARALLELIZATION_NOTE}
          </p>
        </div>
      ) : null}

      {/* Section B — slots (only after team) */}
      {!showTeamsFallback && teamChosen ? (
        <div
          className="mt-12 border-t border-[#C9B27C]/14 pt-12"
          data-testid="booking-schedule-slot-section"
        >
          <p className="font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">
            {BOOKING_SCHEDULE_FIRST_VISIT_TIME_TITLE}
          </p>
          <p className="mt-2 max-w-2xl font-[var(--font-manrope)] text-sm font-medium leading-6 text-[#475569]">
            {BOOKING_SCHEDULE_FIRST_VISIT_TIME_EXPLAINER}
          </p>
          <p className="mt-2 max-w-2xl font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
            {BOOKING_SCHEDULE_SLOTS_LEAD}
          </p>

          {windowsLoading ? (
            <div data-testid="booking-schedule-windows-loading">
              <p className="mt-6 font-[var(--font-manrope)] text-sm text-[#64748B]">
                {BOOKING_SCHEDULE_WINDOWS_LOADING}
              </p>
              {windowsLoadSlowHint ? (
                <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#64748B]">
                  {BOOKING_SCHEDULE_WINDOWS_LOADING_STILL}
                </p>
              ) : null}
            </div>
          ) : slotsEmptyForSelectedTeam ? (
            <div
              data-testid="booking-schedule-no-slots-fallback"
              className="mt-8 rounded-2xl border border-[#C9B27C]/20 bg-white px-6 py-8 shadow-sm ring-1 ring-[#C9B27C]/10"
            >
              <p className="font-[var(--font-poppins)] text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">
                {BOOKING_SCHEDULE_NO_SLOTS_FOR_TEAM_TITLE}
              </p>
              <p className="mt-3 max-w-2xl font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                {BOOKING_SCHEDULE_NO_SLOTS_FOR_TEAM_BODY}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {hasAlternateTeamToSwitchTo ? (
                  <button
                    type="button"
                    data-testid="booking-schedule-switch-team"
                    onClick={() => onSwitchToAlternateTeam()}
                    className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-8 py-3.5 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76]"
                  >
                    {BOOKING_SCHEDULE_NO_SLOTS_TRY_OTHER_TEAM_CTA}
                  </button>
                ) : null}
                <button
                  type="button"
                  data-testid="booking-schedule-no-slots-back-review"
                  onClick={() => onBackToReviewFromSchedule()}
                  className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/28 px-8 py-3.5 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-white"
                >
                  {BOOKING_SCHEDULE_NO_SLOTS_BACK_TO_REVIEW_CTA}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {state.availableWindows.map((w) => (
                <BookingOptionCard
                  key={`${w.startAt}-${w.endAt}`}
                  title={formatSlotLabel(w.startAt)}
                  body={BOOKING_SCHEDULE_SLOT_CARD_BODY}
                  selected={
                    selectedSlotId === w.slotId?.trim()
                  }
                  onClick={() => onSelectSlot(w.slotId, w.startAt, w.endAt)}
                />
              ))}
            </div>
          )}

          {/* Section C — summary + final confirm */}
          {!slotsEmptyForSelectedTeam ? (
            <div className="mt-10 border-t border-[#C9B27C]/14 pt-10">
              {scheduleCommitError ? (
                <div
                  data-testid="booking-schedule-commit-error"
                  className="mb-6 rounded-2xl border border-amber-200/90 bg-amber-50/90 px-5 py-4 font-[var(--font-manrope)] text-sm leading-6 text-amber-950"
                >
                  {scheduleCommitError}
                  {scheduleCommitPhase === "hold_failed" ? (
                    <p className="mt-3 text-sm text-amber-950/90">{BOOKING_SCHEDULE_HOLD_FAILED_HINT}</p>
                  ) : null}
                  {scheduleCommitPhase === "confirm_failed" ? (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        data-testid="booking-schedule-retry-confirm"
                        disabled={confirmLoading}
                        onClick={() => onRetryConfirmBooking()}
                        className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-6 py-2.5 font-[var(--font-manrope)] text-sm font-semibold text-white transition hover:bg-[#0b7f76] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {BOOKING_SCHEDULE_RETRY_CONFIRM_CTA}
                      </button>
                      <button
                        type="button"
                        data-testid="booking-schedule-choose-different-time"
                        disabled={confirmLoading}
                        onClick={() => onChooseDifferentTimeAfterConfirmFail()}
                        className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/28 px-6 py-2.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {BOOKING_SCHEDULE_CHOOSE_DIFFERENT_TIME_CTA}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {slotChosen ? (
                <div
                  data-testid="booking-schedule-summary"
                  className="mb-6 rounded-2xl border border-[#C9B27C]/18 bg-[#FFF9F3] px-5 py-4 shadow-sm ring-1 ring-[#C9B27C]/10"
                >
                  <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                    {BOOKING_SCHEDULE_SUMMARY_TITLE}
                  </p>
                  <p className="mt-3 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                    <span className="text-[#64748B]">{BOOKING_SCHEDULE_SUMMARY_TEAM_LABEL}:</span>{" "}
                    {state.selectedTeamDisplayName.trim()}
                  </p>
                  <p className="mt-2 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                    <span className="text-[#64748B]">{BOOKING_SCHEDULE_SUMMARY_ARRIVAL_LABEL}:</span>{" "}
                    {formatArrivalWindow(
                      state.selectedSlotStart.trim(),
                      state.selectedSlotEnd.trim(),
                    )}
                  </p>
                  {laborEffortMinutes != null &&
                  Number.isFinite(laborEffortMinutes) ? (
                    <p className="mt-2 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                      <span className="text-[#64748B]">
                        {BOOKING_SCHEDULE_CLEANING_EFFORT_LABEL}:
                      </span>{" "}
                      {formatEstimateDurationMinutes(laborEffortMinutes)}
                    </p>
                  ) : null}
                  {!windowsLoading &&
                  contextMatchesTeam &&
                  scheduleTeamDurationContext?.estimatedInHomeMinutes != null &&
                  Number.isFinite(
                    scheduleTeamDurationContext.estimatedInHomeMinutes,
                  ) ? (
                    <p className="mt-2 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                      <span className="text-[#64748B]">
                        {BOOKING_SCHEDULE_IN_HOME_TIME_LABEL}:
                      </span>{" "}
                      {formatApproximateInHomeDurationMinutes(
                        scheduleTeamDurationContext.estimatedInHomeMinutes,
                      )}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {slotChosen && schedulePreview != null ? (
                <div data-testid="schedule-preview" className="mt-6 rounded-2xl border p-4">
                  <p className="mb-2 font-semibold">
                    Your full schedule based on this time:
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>Visit 1: {formatSchedulePreviewDate(schedulePreview.visit1)}</li>
                    <li>Visit 2: {formatSchedulePreviewDate(schedulePreview.visit2)}</li>
                    <li>Visit 3: {formatSchedulePreviewDate(schedulePreview.visit3)}</li>
                    <li className="mt-2 font-medium">
                      Recurring begins: {formatSchedulePreviewDate(schedulePreview.recurringStart)}
                    </li>
                  </ul>
                </div>
              ) : null}

              {!slotChosen ? (
                <p className="mb-4 font-[var(--font-manrope)] text-sm text-[#64748B]">
                  {BOOKING_SCHEDULE_CHOOSE_SLOT_HINT}
                </p>
              ) : null}

              <button
                type="button"
                data-testid="booking-schedule-confirm-booking"
                disabled={!canConfirm || confirmLoading}
                onClick={() => onConfirmArrival()}
                className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-8 py-4 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmLoading ? BOOKING_SCHEDULE_CONFIRMING : BOOKING_SCHEDULE_CONFIRM_BOOKING_CTA}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </BookingSectionCard>
  );
}
