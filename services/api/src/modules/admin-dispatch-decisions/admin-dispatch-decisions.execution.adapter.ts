import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { DispatchOpsService } from "../bookings/dispatch-ops.service";
import { BookingDispatchControlService } from "../bookings/booking-dispatch-control.service";
import { BookingReviewControlService } from "../bookings/booking-review-control.service";
import type { ExecuteAdminDispatchDecisionResult } from "./admin-dispatch-decisions.execution.types";

type DecisionRecord = {
  id: string;
  bookingId: string;
  action:
    | "approve_assignment"
    | "reassign"
    | "hold"
    | "escalate"
    | "request_review";
  rationale: string;
  targetFoId: string | null;
  submittedByUserId: string;
};

@Injectable()
export class AdminDispatchDecisionsExecutionAdapter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchOpsService: DispatchOpsService,
    private readonly bookingDispatchControlService: BookingDispatchControlService,
    private readonly bookingReviewControlService: BookingReviewControlService,
  ) {}

  async applyDecision(decision: DecisionRecord): Promise<ExecuteAdminDispatchDecisionResult> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: decision.bookingId },
      select: { id: true, foId: true, status: true },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found.");
    }

    const adminId = decision.submittedByUserId;

    if (decision.action === "approve_assignment") {
      if (!decision.targetFoId) {
        return {
          outcome: "rejected",
          errorCode: "TARGET_FO_REQUIRED",
          message: "Target FO is required for assignment approval.",
        };
      }

      await this.dispatchOpsService.manualAssign(
        decision.bookingId,
        decision.targetFoId,
        adminId,
      );

      return {
        outcome: "applied",
        message: "Assignment approved and applied via dispatch ops.",
      };
    }

    if (decision.action === "reassign") {
      if (!decision.targetFoId) {
        return {
          outcome: "rejected",
          errorCode: "TARGET_FO_REQUIRED",
          message: "Target FO is required for reassignment.",
        };
      }

      await this.dispatchOpsService.manualRedispatch(decision.bookingId, adminId);

      await this.dispatchOpsService.manualAssign(
        decision.bookingId,
        decision.targetFoId,
        adminId,
      );

      return {
        outcome: "applied",
        message: "Booking reassigned via redispatch + manual assignment.",
      };
    }

    if (decision.action === "hold") {
      await this.bookingDispatchControlService.applyHold({
        bookingId: decision.bookingId,
        adminUserId: adminId,
        reason: decision.rationale,
        source: "admin_dispatch_decision",
      });

      return {
        outcome: "applied",
        message:
          "Admin hold applied. Manual dispatch actions are now blocked for this booking.",
      };
    }

    if (decision.action === "request_review") {
      await this.bookingReviewControlService.requestReview({
        bookingId: decision.bookingId,
        adminUserId: adminId,
        reason: decision.rationale,
        source: "admin_dispatch_decision",
      });

      return {
        outcome: "applied",
        message:
          "Review requirement applied. Manual dispatch actions are now blocked until review is completed.",
      };
    }

    if (decision.action === "escalate") {
      return {
        outcome: "applied",
        message: "Escalation recorded. Routing logic ready for next layer.",
      };
    }

    return {
      outcome: "rejected",
      errorCode: "UNSUPPORTED_ACTION",
      message: "Unsupported dispatch decision action.",
    };
  }
}
