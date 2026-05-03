import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function isEligibleForRecurringPlan(booking: {
  status: string;
  publicDepositStatus?: string | null;
  scheduledStart?: Date | string | null;
}) {
  const isCompleted = booking.status === 'completed';

  const isConfirmedPublicBooking =
    booking.status === 'assigned' &&
    booking.publicDepositStatus === 'deposit_succeeded' &&
    Boolean(booking.scheduledStart);

  return isCompleted || isConfirmedPublicBooking;
}

function readEstimatedMinutes(outputJson: unknown) {
  if (outputJson && typeof outputJson === 'object') {
    const estimatedDurationMinutes = (
      outputJson as { estimatedDurationMinutes?: unknown }
    ).estimatedDurationMinutes;

    if (typeof estimatedDurationMinutes === 'number') {
      return estimatedDurationMinutes;
    }
  }

  return 120;
}

function readFirstCleanPriceCents(booking: {
  estimatedTotalCentsSnapshot?: number | null;
  quotedTotal?: unknown;
  priceTotal?: number | null;
}) {
  if (
    typeof booking.estimatedTotalCentsSnapshot === 'number' &&
    booking.estimatedTotalCentsSnapshot > 0
  ) {
    return booking.estimatedTotalCentsSnapshot;
  }

  const quotedTotal = Number(booking.quotedTotal);
  if (Number.isFinite(quotedTotal) && quotedTotal > 0) {
    return Math.round(quotedTotal * 100);
  }

  if (typeof booking.priceTotal === 'number' && booking.priceTotal > 0) {
    return Math.round(booking.priceTotal * 100);
  }

  return 0;
}

@Injectable()
export class RecurringPlanService {
  constructor(private prisma: PrismaService) {}

  private cadenceDaysMap = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
  } as const;

  private discountMap = {
    weekly: 15,
    biweekly: 10,
    monthly: 5,
  } as const;

  getRecurringOfferQuote(params: {
    firstCleanPriceCents: number;
    estimatedMinutes: number;
  }) {
    const cadences = ['weekly', 'biweekly', 'monthly'] as const;

    return cadences.map((cadence) => {
      const discountPercent = this.discountMap[cadence];
      const recurringPriceCents = Math.round(
        params.firstCleanPriceCents * (1 - discountPercent / 100),
      );

      return {
        cadence,
        firstCleanPriceCents: params.firstCleanPriceCents,
        recurringPriceCents,
        savingsCents: Math.max(
          0,
          params.firstCleanPriceCents - recurringPriceCents,
        ),
        discountPercent,
        estimatedMinutes: params.estimatedMinutes,
      };
    });
  }

  async getOfferQuoteForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { estimateSnapshot: true },
    });

    if (!booking) {
      throw new BadRequestException('BOOKING_NOT_FOUND');
    }

    const estimatedMinutes = readEstimatedMinutes(
      booking.estimateSnapshot?.outputJson,
    );

    return this.getRecurringOfferQuote({
      firstCleanPriceCents: readFirstCleanPriceCents(booking),
      estimatedMinutes,
    });
  }

  async listForAdmin(params?: {
    status?: 'active' | 'paused' | 'cancelled';
    cadence?: 'weekly' | 'biweekly' | 'monthly';
  }) {
    return this.prisma.recurringPlan.findMany({
      where: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.cadence ? { cadence: params.cadence } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async recordOutcome(params: {
    bookingId: string;
    converted: boolean;
    cadence?: 'weekly' | 'biweekly' | 'monthly';
  }) {
    return this.prisma.recurringPlanOutcome.upsert({
      where: { bookingId: params.bookingId },
      update: {
        converted: params.converted,
        cadence: params.cadence ?? null,
        recordedAt: new Date(),
      },
      create: {
        bookingId: params.bookingId,
        converted: params.converted,
        cadence: params.cadence ?? null,
      },
    });
  }

  async markNotConverted(bookingId: string) {
    return this.recordOutcome({
      bookingId,
      converted: false,
    });
  }

  async listOutcomesForAdmin(params?: { converted?: boolean }) {
    return this.prisma.recurringPlanOutcome.findMany({
      where: {
        ...(params?.converted !== undefined
          ? { converted: params.converted }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async createFromBooking(params: {
    bookingId: string;
    cadence: 'weekly' | 'biweekly' | 'monthly';
  }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        estimateSnapshot: true,
        customer: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('BOOKING_NOT_FOUND');
    }

    if (!isEligibleForRecurringPlan(booking)) {
      throw new BadRequestException('BOOKING_NOT_RECURRING_ELIGIBLE');
    }

    const existing = await this.prisma.recurringPlan.findFirst({
      where: { bookingId: params.bookingId },
    });

    if (existing) {
      throw new BadRequestException('RECURRING_PLAN_ALREADY_EXISTS');
    }

    const estimatedMinutes = readEstimatedMinutes(
      booking.estimateSnapshot?.outputJson,
    );

    const basePrice = 0;

    const discountPercent = this.discountMap[params.cadence];

    const pricePerVisitCents = Math.round(
      basePrice * (1 - discountPercent / 100),
    );

    const now = new Date();

    const nextRunAt = new Date(
      now.getTime() +
        this.cadenceDaysMap[params.cadence] * 24 * 60 * 60 * 1000,
    );

    const plan = await this.prisma.recurringPlan.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        franchiseOwnerId: null,
        cadence: params.cadence,
        status: 'active',
        pricePerVisitCents,
        estimatedMinutes,
        discountPercent,
        startAt: now,
        nextRunAt,
      },
    });

    await this.recordOutcome({
      bookingId: booking.id,
      converted: true,
      cadence: params.cadence,
    });

    return plan;
  }
}
