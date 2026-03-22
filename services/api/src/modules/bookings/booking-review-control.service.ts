import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";

@Injectable()
export class BookingReviewControlService {
  constructor(private readonly prisma: PrismaService) {}

  async getControl(bookingId: string) {
    return this.prisma.bookingDispatchControl.findUnique({
      where: { bookingId },
    });
  }

  async isReviewRequired(bookingId: string): Promise<boolean> {
    const control = await this.getControl(bookingId);
    return Boolean(control?.reviewRequired);
  }

  async assertReviewNotRequired(bookingId: string): Promise<void> {
    const reviewRequired = await this.isReviewRequired(bookingId);

    if (reviewRequired) {
      throw new BadRequestException(
        "Booking is currently under required review and cannot be dispatched.",
      );
    }
  }

  async requestReview(input: {
    bookingId: string;
    adminUserId: string;
    reason: string;
    source: string;
  }) {
    return this.prisma.bookingDispatchControl.upsert({
      where: { bookingId: input.bookingId },
      update: {
        reviewRequired: true,
        reviewReason: input.reason,
        reviewSource: input.source,
        reviewRequestedByAdminId: input.adminUserId,
        reviewRequestedAt: new Date(),
        reviewCompletedAt: null,
      },
      create: {
        bookingId: input.bookingId,
        holdActive: false,
        reviewRequired: true,
        reviewReason: input.reason,
        reviewSource: input.source,
        reviewRequestedByAdminId: input.adminUserId,
        reviewRequestedAt: new Date(),
        reviewCompletedAt: null,
      },
    });
  }

  async completeReview(input: { bookingId: string }) {
    return this.prisma.bookingDispatchControl.upsert({
      where: { bookingId: input.bookingId },
      update: {
        reviewRequired: false,
        reviewCompletedAt: new Date(),
      },
      create: {
        bookingId: input.bookingId,
        holdActive: false,
        reviewRequired: false,
        reviewCompletedAt: new Date(),
      },
    });
  }
}
