import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

    if (booking.status !== 'completed') {
      throw new BadRequestException('BOOKING_NOT_COMPLETED');
    }

    const existing = await this.prisma.recurringPlan.findFirst({
      where: { bookingId: params.bookingId },
    });

    if (existing) {
      throw new BadRequestException('RECURRING_PLAN_ALREADY_EXISTS');
    }

    const outputJson = booking.estimateSnapshot?.outputJson as
      | { estimatedDurationMinutes?: number }
      | undefined;
    const estimatedMinutes = outputJson?.estimatedDurationMinutes ?? 120;

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
