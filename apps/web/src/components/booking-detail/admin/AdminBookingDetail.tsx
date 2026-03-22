"use client";

import { useCallback, useMemo } from "react";
import { buildAdminBookingDispatchDetailModel } from "@/operations/adminBookingDispatch/adminBookingDispatchDetailSelectors";
import { normalizeBookingScreen } from "@/contracts/contractNormalization";
import type {
  AdminDispatchDecisionAction,
  AdminDispatchDecisionInput,
} from "@/contracts/adminDispatchDecision";
import { useAdminDispatchDecisionMutation } from "@/operations/adminDispatchDecision/useAdminDispatchDecisionMutation";
import AdminBookingDispatchHeaderCard from "./AdminBookingDispatchHeaderCard";
import AdminBookingCandidateRankingCard from "./AdminBookingCandidateRankingCard";
import AdminBookingEconomicsCard from "./AdminBookingEconomicsCard";
import AdminBookingGovernanceCard from "./AdminBookingGovernanceCard";
import AdminBookingDispatchTimelineCard from "./AdminBookingDispatchTimelineCard";
import AdminBookingDispatchActionBar from "./AdminBookingDispatchActionBar";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getBookingIdFromInput(screen?: unknown): string {
  const normalized = normalizeBookingScreen(screen);
  if (normalized) return normalized.booking.id;

  if (!isRecord(screen)) return "unknown-booking";

  if (typeof screen.bookingId === "string" && screen.bookingId.trim()) {
    return screen.bookingId;
  }

  if (
    isRecord(screen.booking) &&
    typeof screen.booking.id === "string" &&
    screen.booking.id.trim()
  ) {
    return screen.booking.id;
  }

  if (typeof screen.id === "string" && screen.id.trim()) {
    return screen.id;
  }

  return "unknown-booking";
}

interface AdminBookingDetailProps {
  bookingId?: string;
  bookingScreen?: unknown;
  bookingScreens?: unknown[];
  onStageDecision?: (input: {
    bookingId: string;
    action: AdminDispatchDecisionAction;
    rationale: string;
    targetFoId?: string;
  }) => void | Promise<void>;
}

export default function AdminBookingDetail({
  bookingId,
  bookingScreen,
  bookingScreens,
  onStageDecision,
}: AdminBookingDetailProps) {
  const resolvedBookingId = bookingId ?? getBookingIdFromInput(bookingScreen);
  const resolvedScreens =
    bookingScreens ?? (bookingScreen !== undefined ? [bookingScreen] : []);

  const detail = useMemo(
    () =>
      buildAdminBookingDispatchDetailModel({
        bookingId: resolvedBookingId,
        bookingScreens: resolvedScreens,
        source: "admin_booking_detail",
      }),
    [resolvedBookingId, resolvedScreens],
  );

  const mutation = useAdminDispatchDecisionMutation();

  const handleSubmit = useCallback(
    async (input: {
      bookingId: string;
      action: AdminDispatchDecisionAction;
      rationale: string;
      targetFoId?: string;
    }) => {
      if (onStageDecision) {
        await onStageDecision(input);
        return;
      }

      const payload: AdminDispatchDecisionInput = {
        bookingId: input.bookingId,
        action: input.action,
        rationale: input.rationale,
        targetFoId: input.targetFoId,
        submittedAt: new Date().toISOString(),
        submittedByRole: "admin",
        source: "admin_booking_detail",
      };

      await mutation.submit(payload);
    },
    [mutation, onStageDecision],
  );

  return (
    <div className="space-y-6">
      <AdminBookingDispatchHeaderCard summary={detail.summary} />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <AdminBookingCandidateRankingCard candidates={detail.candidates} />
        <AdminBookingEconomicsCard economics={detail.economics} />
      </div>

      <AdminBookingGovernanceCard governance={detail.governance} />

      <AdminBookingDispatchActionBar
        bookingId={detail.summary.bookingId}
        candidates={detail.candidates}
        defaultAction={detail.defaultAction}
        defaultActionReason={detail.defaultActionReason}
        source="admin_booking_detail"
        isSubmitting={mutation.isSubmitting}
        submissionError={mutation.errorMessage}
        submissionUnavailable={mutation.unavailableMessage}
        submissionSuccess={mutation.successMessage}
        onSubmit={handleSubmit}
      />

      <AdminBookingDispatchTimelineCard timeline={detail.timeline} />
    </div>
  );
}
