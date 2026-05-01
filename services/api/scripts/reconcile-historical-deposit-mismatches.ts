import "dotenv/config";

import {
  BookingEventType,
  BookingPaymentStatus,
  BookingPublicDepositStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

const SCRIPT_VERSION = "targeted-historical-deposit-mismatch-reconciliation-v1";
const RECONCILIATION_TYPE = "historical_deposit_mismatch_fix";
const CONFIRMATION_PHRASE = "RECONCILE_HISTORICAL_DEPOSIT_MISMATCHES";
const EVENT_TYPE = "PAYMENT_RECONCILIATION_APPLIED" as BookingEventType;

type JsonRecord = Record<string, unknown>;

type ReconciliationBooking = {
  id: string;
  status?: string | null;
  paymentStatus: BookingPaymentStatus | string;
  publicDepositStatus: BookingPublicDepositStatus | string;
  publicDepositPaymentIntentId?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  customer?: { email?: string | null; name?: string | null } | null;
  paymentAnomalies?: Array<{
    id: string;
    kind: string;
    status: string;
    detectedAt: Date | string;
  }>;
};

export type ReconcileHistoricalDepositMismatchOptions = {
  execute?: boolean;
  confirm?: string | null;
  executedBy?: string;
  now?: Date;
  sampleLimit?: number;
};

export type ReconcileHistoricalDepositMismatchReport = {
  mode: "dry_run" | "execute";
  scriptVersion: string;
  executedBy: string;
  dryRun: boolean;
  totalEligible: number;
  alreadyReconciled: number;
  wouldUpdate: number;
  updated: number;
  skipped: number;
  errors: Array<{ bookingId: string; message: string }>;
  sampleBookingIds: string[];
  updatedBookingIds: string[];
  skippedBookingIds: string[];
  alreadyReconciledBookingIds: string[];
};

function parseArgs(argv: string[]) {
  const execute = argv.includes("--execute");
  const confirmArg = argv.find((arg) => arg.startsWith("--confirm="));
  const executedByArg = argv.find((arg) => arg.startsWith("--executedBy="));
  return {
    execute,
    confirm: confirmArg?.slice("--confirm=".length) ?? null,
    executedBy:
      executedByArg?.slice("--executedBy=".length)?.trim() ||
      process.env.USER ||
      "reconciliation-script",
  };
}

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

function isEligible(booking: ReconciliationBooking | null | undefined) {
  return (
    booking?.paymentStatus === BookingPaymentStatus.payment_pending &&
    booking.publicDepositStatus === BookingPublicDepositStatus.deposit_succeeded
  );
}

function idempotencyKey(bookingId: string) {
  return `${RECONCILIATION_TYPE}:${bookingId}`;
}

function auditPayload(args: {
  previousPaymentStatus: string;
  publicDepositStatus: string;
  executedBy: string;
  dryRun: boolean;
  reason: string;
}) {
  return {
    reconciliationType: RECONCILIATION_TYPE,
    previousPaymentStatus: args.previousPaymentStatus,
    newPaymentStatus: BookingPaymentStatus.authorized,
    publicDepositStatus: args.publicDepositStatus,
    reason: args.reason,
    executedBy: args.executedBy,
    dryRun: args.dryRun,
    scriptVersion: SCRIPT_VERSION,
  } satisfies Prisma.InputJsonObject;
}

async function hasAppliedAuditEvent(prisma: PrismaClient, bookingId: string) {
  const event = await prisma.bookingEvent.findFirst({
    where: {
      bookingId,
      type: EVENT_TYPE,
      payload: {
        path: ["reconciliationType"],
        equals: RECONCILIATION_TYPE,
      },
    },
    select: { id: true },
  });
  return Boolean(event);
}

async function findEligibleBookings(prisma: PrismaClient) {
  return prisma.booking.findMany({
    where: {
      paymentStatus: BookingPaymentStatus.payment_pending,
      publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      publicDepositStatus: true,
      publicDepositPaymentIntentId: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function paymentAnomaliesByBooking(prisma: PrismaClient, bookingIds: string[]) {
  if (bookingIds.length === 0) return new Map<string, ReconciliationBooking["paymentAnomalies"]>();
  const rows = await prisma.paymentAnomaly.findMany({
    where: { bookingId: { in: bookingIds } },
    select: {
      id: true,
      bookingId: true,
      kind: true,
      status: true,
      detectedAt: true,
    },
    orderBy: { detectedAt: "desc" },
  });
  const byBooking = new Map<string, ReconciliationBooking["paymentAnomalies"]>();
  for (const row of rows) {
    if (!row.bookingId) continue;
    const bucket = byBooking.get(row.bookingId) ?? [];
    bucket.push({
      id: row.id,
      kind: row.kind,
      status: row.status,
      detectedAt: row.detectedAt,
    });
    byBooking.set(row.bookingId, bucket);
  }
  return byBooking;
}

export async function reconcileHistoricalDepositMismatches(
  prisma: PrismaClient,
  options: ReconcileHistoricalDepositMismatchOptions = {},
): Promise<ReconcileHistoricalDepositMismatchReport> {
  const execute = Boolean(options.execute);
  const confirmed = options.confirm === CONFIRMATION_PHRASE;
  const dryRun = !(execute && confirmed);
  const executedBy = options.executedBy?.trim() || "reconciliation-script";
  const sampleLimit = options.sampleLimit ?? 20;
  const eligible = await findEligibleBookings(prisma);
  const anomalyMap = await paymentAnomaliesByBooking(
    prisma,
    eligible.map((booking) => booking.id),
  );

  const report: ReconcileHistoricalDepositMismatchReport = {
    mode: dryRun ? "dry_run" : "execute",
    scriptVersion: SCRIPT_VERSION,
    executedBy,
    dryRun,
    totalEligible: eligible.length,
    alreadyReconciled: 0,
    wouldUpdate: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    sampleBookingIds: eligible.slice(0, sampleLimit).map((booking) => booking.id),
    updatedBookingIds: [],
    skippedBookingIds: [],
    alreadyReconciledBookingIds: [],
  };

  for (const booking of eligible) {
    const withAnomalies = {
      ...booking,
      paymentAnomalies: anomalyMap.get(booking.id) ?? [],
    };

    try {
      if (await hasAppliedAuditEvent(prisma, booking.id)) {
        report.alreadyReconciled += 1;
        report.alreadyReconciledBookingIds.push(booking.id);
        continue;
      }

      if (dryRun) {
        report.wouldUpdate += 1;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        const current = await tx.booking.findUnique({
          where: { id: booking.id },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            publicDepositStatus: true,
          },
        });

        if (!isEligible(current)) {
          report.skipped += 1;
          report.skippedBookingIds.push(booking.id);
          return;
        }

        const existing = await tx.bookingEvent.findFirst({
          where: {
            bookingId: booking.id,
            type: EVENT_TYPE,
            payload: {
              path: ["reconciliationType"],
              equals: RECONCILIATION_TYPE,
            },
          },
          select: { id: true },
        });

        if (existing) {
          report.alreadyReconciled += 1;
          report.alreadyReconciledBookingIds.push(booking.id);
          return;
        }

        const reason =
          "Historical public deposit success left booking paymentStatus as payment_pending; aligning to authorized without Stripe side effects.";
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: BookingPaymentStatus.authorized,
            paymentAuthorizedAt: options.now ?? new Date(),
          },
        });
        await tx.bookingEvent.create({
          data: {
            bookingId: booking.id,
            type: EVENT_TYPE,
            idempotencyKey: idempotencyKey(booking.id),
            note: "Historical deposit/payment mismatch reconciled.",
            createdBy: executedBy,
            payload: auditPayload({
              previousPaymentStatus: String(current?.paymentStatus),
              publicDepositStatus: String(current?.publicDepositStatus),
              executedBy,
              dryRun: false,
              reason,
            }),
          },
        });
        report.updated += 1;
        report.updatedBookingIds.push(booking.id);
      });
    } catch (error) {
      report.errors.push({
        bookingId: withAnomalies.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return report;
}

async function main() {
  const prisma = new PrismaClient();
  const args = parseArgs(process.argv.slice(2));
  try {
    const report = await reconcileHistoricalDepositMismatches(prisma, args);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  });
}

export const historicalDepositMismatchReconciliationInternals = {
  SCRIPT_VERSION,
  RECONCILIATION_TYPE,
  CONFIRMATION_PHRASE,
  EVENT_TYPE,
  auditPayload,
  idempotencyKey,
  isEligible,
  iso,
};
