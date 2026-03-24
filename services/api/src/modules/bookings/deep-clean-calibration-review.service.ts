import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { mapProgramCalibrationToAnalyticsBookingRowDto } from "./deep-clean-analytics-row.map";
import type { UpdateDeepCleanCalibrationReviewRequestDto } from "./dto/deep-clean-calibration-review.dto";
import { normalizeAndValidateReviewTags } from "./deep-clean-review-tags";

@Injectable()
export class DeepCleanCalibrationReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async updateCalibrationReview(input: {
    bookingId: string;
    actorUserId: string;
    dto: UpdateDeepCleanCalibrationReviewRequestDto;
  }) {
    const existing = await this.prisma.bookingDeepCleanProgramCalibration.findUnique({
      where: { bookingId: input.bookingId },
      include: { booking: { select: { createdAt: true, updatedAt: true } } },
    });
    if (!existing) {
      throw new NotFoundException("Program calibration not found for booking");
    }

    if (input.dto.reviewStatus === "reviewed") {
      const tags = normalizeAndValidateReviewTags(input.dto.reviewReasonTags ?? []);
      if (tags.length === 0) {
        throw new BadRequestException(
          "At least one reason tag is required when reviewStatus is reviewed",
        );
      }
      const now = new Date();
      const note =
        input.dto.reviewNote != null && String(input.dto.reviewNote).trim()
          ? String(input.dto.reviewNote).trim()
          : null;
      const updated = await this.prisma.bookingDeepCleanProgramCalibration.update({
        where: { bookingId: input.bookingId },
        data: {
          reviewStatus: "reviewed",
          reviewedAt: now,
          reviewedByUserId: input.actorUserId,
          reviewReasonTagsJson: tags,
          reviewNote: note,
        },
        include: { booking: { select: { createdAt: true, updatedAt: true } } },
      });
      return mapProgramCalibrationToAnalyticsBookingRowDto(updated);
    }

    const updated = await this.prisma.bookingDeepCleanProgramCalibration.update({
      where: { bookingId: input.bookingId },
      data: {
        reviewStatus: "unreviewed",
        reviewedAt: null,
        reviewedByUserId: null,
        reviewReasonTagsJson: Prisma.DbNull,
        reviewNote: null,
      },
      include: { booking: { select: { createdAt: true, updatedAt: true } } },
    });
    return mapProgramCalibrationToAnalyticsBookingRowDto(updated);
  }
}
