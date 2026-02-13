import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { createHash } from "crypto";
import { BookingEventType, OpsAlertSeverity, OpsAnomalyType } from "@prisma/client";
import { PrismaService } from "../../prisma";

@Injectable()
export class IntegritySweepCron {
  constructor(private readonly db: PrismaService) {}

  private fingerprintFor(params: {
    anomalyType: OpsAnomalyType;
    bookingId: string;
    foId?: string | null;
  }) {
    const fo = params.foId ? String(params.foId) : "none";
    return `${params.anomalyType}:${params.bookingId}:${fo}`;
  }

  private severityFor(anomalyType: OpsAnomalyType): "info" | "warning" | "critical" {
    if (anomalyType === OpsAnomalyType.INTEGRITY_BILLING_SESSION_STALE) return "critical";
    if (anomalyType === OpsAnomalyType.UNKNOWN) return "info";
    return "warning";
  }

  private makeFingerprint(input: {
    anomalyType: OpsAnomalyType;
    bookingId: string;
    foId?: string | null;
    payload: any;
  }): string {
    const { anomalyType, bookingId, foId, payload } = input;

    // Prefer stable "identity" fields if present in payload
    const identity =
      payload?.refundIntentId ??
      payload?.disputeCaseId ??
      payload?.billingSessionId ??
      payload?.stripeDisputeId ??
      payload?.stripeRefundId ??
      null;

    const base = {
      anomalyType,
      bookingId,
      foId: foId ?? null,
      identity,
    };

    return createHash("sha256").update(JSON.stringify(base)).digest("hex");
  }

  private async upsertAlertFromBookingEvent(params: {
    bookingId: string;
    eventId: string;
    anomalyType: OpsAnomalyType;
    payload: any;
    bookingStatus?: string | null;
    foId?: string | null;
  }) {
    const { bookingId, eventId, anomalyType, payload, bookingStatus, foId } = params;

    const nowDate = new Date();
    const severity = this.severityFor(anomalyType);
    const fingerprint = this.fingerprintFor({ anomalyType, bookingId, foId });

    await this.db.opsAlert.upsert({
      where: { sourceEventId: eventId },
      create: {
        sourceEventId: eventId,
        bookingId,
        foId: foId ?? null,
        bookingStatus: (bookingStatus as any) ?? null,
        anomalyType,
        status: "open",

        severity: severity as any,
        fingerprint,
        firstSeenAt: nowDate,
        lastSeenAt: nowDate,
        occurrences: 1,

        payloadJson: JSON.stringify(payload),

        slaDueAt: new Date(
          nowDate.getTime() + (severity === "critical" ? 30 : 4 * 60) * 60 * 1000,
        ),
      },
      update: {
        payloadJson: JSON.stringify(payload),
        foId: foId ?? undefined,
        bookingStatus: (bookingStatus as any) ?? undefined,

        lastSeenAt: nowDate,

        ...(severity === "critical" ? { severity: "critical" as any } : {}),
      },
    });

    // --- Durable rollup per fingerprint (fast inbox) ---
    const existingRollup = await this.db.opsAlertRollup.findUnique({
      where: { fingerprint },
      select: {
        id: true,
        status: true,
        severity: true,
        slaDueAt: true,
        slaBreachedAt: true,
        firstSeenAt: true,
        occurrences: true,
      },
    });

    const rollupCreateSlaDueAt = new Date(
      nowDate.getTime() + (severity === "critical" ? 30 : 4 * 60) * 60 * 1000,
    );

    if (!existingRollup) {
      await this.db.opsAlertRollup.create({
        data: {
          fingerprint,
          anomalyType,
          bookingId,
          foId: foId ?? null,
          bookingStatus: (bookingStatus as any) ?? null,
          status: "open",
          severity: severity as any,

          firstSeenAt: nowDate,
          lastSeenAt: nowDate,
          occurrences: 1,

          slaDueAt: rollupCreateSlaDueAt,

          payloadJson: JSON.stringify(payload),
        } as any,
      });
    } else {
      // Respect human actions: do not reopen resolved/acked rollups automatically.
      // Always refresh lastSeenAt + occurrences; severity can only escalate.
      const nextSeverity =
        existingRollup.severity === "critical" || severity !== "critical"
          ? existingRollup.severity
          : ("critical" as any);

      const shouldTightenSla = severity === "critical";

      await this.db.opsAlertRollup.update({
        where: { fingerprint },
        data: {
          bookingId,
          foId: foId ?? undefined,
          bookingStatus: (bookingStatus as any) ?? undefined,
          anomalyType,
          lastSeenAt: nowDate,
          occurrences: { increment: 1 },
          payloadJson: JSON.stringify(payload),

          ...(nextSeverity !== existingRollup.severity ? { severity: nextSeverity } : {}),

          ...(shouldTightenSla
            ? {
                slaDueAt: new Date(nowDate.getTime() + 30 * 60 * 1000),
              }
            : {}),
        } as any,
      });
    }

    // --- Escalation rule: repeated fingerprint in short window bumps to critical ---
    const fifteenMinAgo = new Date(nowDate.getTime() - 15 * 60 * 1000);

    const hits = await this.db.opsAlert.count({
      where: {
        fingerprint,
        createdAt: { gte: fifteenMinAgo },
      },
    });

    if (hits >= 3) {
      await this.db.opsAlert.updateMany({
        where: {
          fingerprint,
          status: "open",
        },
        data: {
          severity: "critical" as any,
          slaDueAt: new Date(nowDate.getTime() + 30 * 60 * 1000),
          lastSeenAt: nowDate,
        },
      });

      await this.db.opsAlertRollup.updateMany({
        where: { fingerprint, status: "open" },
        data: {
          severity: "critical" as any,
          slaDueAt: new Date(nowDate.getTime() + 30 * 60 * 1000),
          lastSeenAt: nowDate,
        } as any,
      });
    }
  }

  @Cron("*/10 * * * *") // every 10 minutes
  async run() {
    if (process.env.ENABLE_INTEGRITY_SWEEP !== "true") return;

    const now = Date.now();

    // 1) Refund drift: executed intents with no refund webhook receipt after 30 minutes
    const thirtyMinAgo = new Date(now - 30 * 60 * 1000);

    const executed = await this.db.refundIntent.findMany({
      where: {
        status: "executed",
        updatedAt: { lt: thirtyMinAgo },
        stripeRefundId: { not: null },
      },
      orderBy: { updatedAt: "asc" },
      take: 25,
    });

    for (const intent of executed) {
      // Have we seen any refund-related webhook receipt for this booking since intent executed?
      const receipt = await this.db.stripeWebhookReceipt.findFirst({
        where: {
          bookingId: intent.bookingId,
          type: { in: ["charge.refund.updated"] },
          createdAt: { gt: intent.updatedAt },
        },
        orderBy: { createdAt: "desc" },
      });

      if (receipt) continue;

      const idempotencyKey = `INTEGRITY_REFUND_WEBHOOK_MISSING:${intent.id}:${intent.updatedAt.toISOString()}`;

      const payload = {
        type: "INTEGRITY_REFUND_WEBHOOK_MISSING",
        bookingId: intent.bookingId,
        refundIntentId: intent.id,
        stripeRefundId: intent.stripeRefundId,
        observedAt: new Date().toISOString(),
        message: "RefundIntent executed but no refund webhook observed after 30 minutes.",
      };

      const ev = await this.db.bookingEvent.upsert({
        where: {
          bookingId_idempotencyKey: {
            bookingId: intent.bookingId,
            idempotencyKey,
          },
        },
        create: {
          bookingId: intent.bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey,
          note: JSON.stringify(payload),
        },
        update: {
          // keep note updated (safe)
          note: JSON.stringify(payload),
        },
      });

      const booking = await this.db.booking.findUnique({
        where: { id: intent.bookingId },
        select: { status: true, foId: true },
      });

      await this.upsertAlertFromBookingEvent({
        bookingId: intent.bookingId,
        eventId: ev.id,
        anomalyType: OpsAnomalyType.INTEGRITY_REFUND_WEBHOOK_MISSING,
        payload,
        bookingStatus: booking?.status ? String(booking.status) : null,
        foId: (booking as any)?.foId ?? null,
      });
    }

    // 2) Dispute drift: disputes in needs_response/under_review older than 7 days
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const disputes = await this.db.disputeCase.findMany({
      where: {
        status: {
          in: ["needs_response", "warning_needs_response", "under_review"],
        },
        updatedAt: { lt: sevenDaysAgo },
      },
      orderBy: { updatedAt: "asc" },
      take: 25,
    });

    for (const d of disputes) {
      const idempotencyKey = `INTEGRITY_DISPUTE_STALE:${d.id}:${d.updatedAt.toISOString()}`;

      const payload = {
        type: "INTEGRITY_DISPUTE_STALE",
        bookingId: d.bookingId,
        disputeCaseId: d.id,
        stripeDisputeId: d.stripeDisputeId,
        status: d.status,
        observedAt: new Date().toISOString(),
        message: "DisputeCase has been in needs_response/under_review for >7 days.",
      };

      const ev = await this.db.bookingEvent.upsert({
        where: {
          bookingId_idempotencyKey: {
            bookingId: d.bookingId,
            idempotencyKey,
          },
        },
        create: {
          bookingId: d.bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey,
          note: JSON.stringify(payload),
        },
        update: { note: JSON.stringify(payload) },
      });

      const booking = await this.db.booking.findUnique({
        where: { id: d.bookingId },
        select: { status: true, foId: true },
      });

      await this.upsertAlertFromBookingEvent({
        bookingId: d.bookingId,
        eventId: ev.id,
        anomalyType: OpsAnomalyType.INTEGRITY_DISPUTE_STALE,
        payload,
        bookingStatus: booking?.status ? String(booking.status) : null,
        foId: (booking as any)?.foId ?? null,
      });
    }

    // 3) Billing session stale: session still open (endedAt null) long after it should have ended
    // Conservative thresholds to avoid noise:
    // - If booking is terminal (completed/canceled): allow 30 minutes for normal close-out
    // - Otherwise: flag only if open for > 6 hours
    const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);

    const openSessions = await this.db.billingSession.findMany({
      where: {
        endedAt: null,
        startedAt: { lt: sixHoursAgo },
      },
      orderBy: { startedAt: "asc" },
      take: 25,
    });

    // For each open session, check booking status for a stronger signal
    const terminalGraceAgo = new Date(now - 30 * 60 * 1000);

    for (const s of openSessions) {
      const booking = await this.db.booking.findUnique({
        where: { id: s.bookingId },
        select: { id: true, status: true },
      });

      const bookingStatus = booking?.status ? String(booking.status) : "unknown";
      const isTerminal = bookingStatus === "completed" || bookingStatus === "canceled";

      // If terminal, only alert if session started > 30 minutes ago (avoid alerting on very fresh sessions)
      if (isTerminal && s.startedAt >= terminalGraceAgo) continue;

      const idempotencyKey = `INTEGRITY_BILLING_SESSION_STALE:${s.id}:${s.startedAt.toISOString()}`;

      const payload = {
        type: "INTEGRITY_BILLING_SESSION_STALE",
        bookingId: s.bookingId,
        foId: s.foId,
        billingSessionId: s.id,
        startedAt: s.startedAt.toISOString(),
        bookingStatus,
        observedAt: new Date().toISOString(),
        message: isTerminal
          ? "BillingSession is still open (endedAt null) even though booking is terminal."
          : "BillingSession has been open (endedAt null) for > 6 hours.",
      };

      const ev = await this.db.bookingEvent.upsert({
        where: {
          bookingId_idempotencyKey: {
            bookingId: s.bookingId,
            idempotencyKey,
          },
        },
        create: {
          bookingId: s.bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey,
          note: JSON.stringify(payload),
        },
        update: { note: JSON.stringify(payload) },
      });

      await this.upsertAlertFromBookingEvent({
        bookingId: s.bookingId,
        eventId: ev.id,
        anomalyType: OpsAnomalyType.INTEGRITY_BILLING_SESSION_STALE,
        payload,
        bookingStatus,
        foId: s.foId ?? null,
      });
    }

    // 4) SLA breach stamping + escalation (idempotent + auditable)
    const nowDate = new Date();

    const newlyBreaching = await this.db.opsAlert.findMany({
      where: {
        status: "open",
        slaDueAt: { not: null, lt: nowDate },
        slaBreachedAt: null,
      },
      select: {
        id: true,
        bookingId: true,
        anomalyType: true,
        severity: true,
        slaDueAt: true,
        assignedToAdminId: true,
      },
      take: 50,
      orderBy: { slaDueAt: "asc" },
    });

    const onCallSetting = await this.db.systemSetting.findUnique({
      where: { key: "OPS_ONCALL_ADMIN_ID" },
    });

    const onCallAdminId =
      (onCallSetting?.value ? String(onCallSetting.value).trim() : "") ||
      process.env.OPS_ONCALL_ADMIN_ID?.trim() ||
      (await this.db.user.findFirst({
        where: { role: "admin" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      }))?.id ||
      null;

    for (const a of newlyBreaching) {
      if (!a.assignedToAdminId && onCallAdminId) {
        await this.db.opsAlert.update({
          where: { id: a.id },
          data: { assignedToAdminId: onCallAdminId },
        });

        const assignKey = `OPS_ALERT_ASSIGNED:${a.id}:${onCallAdminId}:${a.slaDueAt?.toISOString() ?? "no_due"}`;

        try {
          await this.db.bookingEvent.create({
            data: {
              bookingId: a.bookingId,
              type: BookingEventType.NOTE,
              idempotencyKey: assignKey,
              note: JSON.stringify({
                type: "OPS_ALERT_ASSIGNED",
                opsAlertId: a.id,
                bookingId: a.bookingId,
                assignedToAdminId: onCallAdminId,
                assignedAt: nowDate.toISOString(),
                reason: "Auto-routed on SLA breach (was unassigned).",
              }),
            } as any,
          });
        } catch (err: any) {
          if (err?.code !== "P2002") throw err;
        }
      }

      const idempotencyKey = `OPS_ALERT_ESCALATED:${a.id}:${a.slaDueAt?.toISOString() ?? "no_due"}`;

      try {
        await this.db.bookingEvent.create({
          data: {
            bookingId: a.bookingId,
            type: BookingEventType.NOTE,
            idempotencyKey,
            note: JSON.stringify({
              type: "OPS_ALERT_ESCALATED",
              opsAlertId: a.id,
              bookingId: a.bookingId,
              anomalyType: String(a.anomalyType),
              fromSeverity: String(a.severity),
              toSeverity: "critical",
              slaDueAt: a.slaDueAt?.toISOString() ?? null,
              escalatedAt: nowDate.toISOString(),
              message: "SLA breached; alert escalated to critical.",
            }),
          } as any,
        });
      } catch (err: any) {
        if (err?.code !== "P2002") throw err;
      }
    }

    await this.db.opsAlert.updateMany({
      where: {
        status: "open",
        slaDueAt: { not: null, lt: nowDate },
        slaBreachedAt: null,
      },
      data: {
        slaBreachedAt: nowDate,
        severity: "critical",
        lastSeenAt: nowDate,
      },
    });
  }
}
