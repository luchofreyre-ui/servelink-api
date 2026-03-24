import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma";

export type FoAuthorityFeedbackAdminRecentItem = {
  id: string;
  bookingId: string;
  helpful: boolean | null;
  selectedKnowledgePath: string | null;
  notes: string | null;
  createdAt: string;
};

export type FoAuthorityFeedbackAdminPathCount = {
  path: string;
  feedbackCount: number;
};

export type FoAuthorityFeedbackAdminSummaryPayload = {
  kind: "fo_authority_feedback_admin_summary";
  generatedAt: string;
  windowUsed: { fromIso: string; toIso: string } | null;
  totalCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  undecidedCount: number;
  /** Among rows with `helpful` true/false; null when none. */
  helpfulRate: number | null;
  recent: FoAuthorityFeedbackAdminRecentItem[];
  topSelectedKnowledgePaths: FoAuthorityFeedbackAdminPathCount[];
};

@Injectable()
export class FoAuthorityKnowledgeFeedbackService {
  constructor(private readonly db: PrismaService) {}

  private async assertFoCanAccessBooking(
    foUserId: string,
    bookingId: string,
  ): Promise<{ franchiseOwnerId: string }> {
    const fo = await this.db.franchiseOwner.findUnique({
      where: { userId: foUserId },
      select: { id: true },
    });
    if (!fo) throw new ForbiddenException("FO_PROFILE_REQUIRED");

    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, foId: true },
    });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");

    if (booking.foId === fo.id) {
      return { franchiseOwnerId: fo.id };
    }

    const linked = await this.db.bookingOffer.findFirst({
      where: { bookingId, foId: fo.id },
      select: { id: true },
    });
    if (linked) {
      return { franchiseOwnerId: fo.id };
    }

    throw new ForbiddenException("BOOKING_FORBIDDEN");
  }

  async submitFeedback(params: {
    foUserId: string;
    bookingId: string;
    helpful: boolean;
    selectedKnowledgePath?: string | null;
    notes?: string | null;
  }) {
    const { franchiseOwnerId } = await this.assertFoCanAccessBooking(
      params.foUserId,
      params.bookingId,
    );

    return this.db.foAuthorityKnowledgeFeedback.create({
      data: {
        bookingId: params.bookingId,
        franchiseOwnerId,
        helpful: params.helpful,
        selectedKnowledgePath: params.selectedKnowledgePath?.trim() || null,
        notes: params.notes?.trim() || null,
      },
    });
  }

  listFeedbackForBooking(bookingId: string, franchiseOwnerId: string) {
    return this.db.foAuthorityKnowledgeFeedback.findMany({
      where: { bookingId, franchiseOwnerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listRecentFeedback(params: { skip: number; take: number }) {
    const [items, total] = await Promise.all([
      this.db.foAuthorityKnowledgeFeedback.findMany({
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      this.db.foAuthorityKnowledgeFeedback.count(),
    ]);
    return { items, total };
  }

  async buildAdminFeedbackSummary(options: {
    createdAtGte?: Date;
    toIso: Date;
    recentLimit: number;
    topPathsLimit: number;
  }): Promise<FoAuthorityFeedbackAdminSummaryPayload> {
    const where =
      options.createdAtGte != null
        ? { createdAt: { gte: options.createdAtGte } }
        : {};

    const [
      totalCount,
      helpfulCount,
      notHelpfulCount,
      undecidedCount,
      recentRows,
      pathGroups,
    ] = await Promise.all([
      this.db.foAuthorityKnowledgeFeedback.count({ where }),
      this.db.foAuthorityKnowledgeFeedback.count({
        where: { ...where, helpful: true },
      }),
      this.db.foAuthorityKnowledgeFeedback.count({
        where: { ...where, helpful: false },
      }),
      this.db.foAuthorityKnowledgeFeedback.count({
        where: { ...where, helpful: null },
      }),
      this.db.foAuthorityKnowledgeFeedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options.recentLimit,
        select: {
          id: true,
          bookingId: true,
          helpful: true,
          selectedKnowledgePath: true,
          notes: true,
          createdAt: true,
        },
      }),
      this.db.foAuthorityKnowledgeFeedback.groupBy({
        by: ["selectedKnowledgePath"],
        where: {
          ...where,
          selectedKnowledgePath: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { selectedKnowledgePath: "desc" } },
        take: options.topPathsLimit,
      }),
    ]);

    const decided = helpfulCount + notHelpfulCount;
    const helpfulRate = decided > 0 ? helpfulCount / decided : null;

    const windowUsed =
      options.createdAtGte != null
        ? {
            fromIso: options.createdAtGte.toISOString(),
            toIso: options.toIso.toISOString(),
          }
        : null;

    return {
      kind: "fo_authority_feedback_admin_summary",
      generatedAt: new Date().toISOString(),
      windowUsed,
      totalCount,
      helpfulCount,
      notHelpfulCount,
      undecidedCount,
      helpfulRate,
      recent: recentRows.map((r) => ({
        id: r.id,
        bookingId: r.bookingId,
        helpful: r.helpful,
        selectedKnowledgePath: r.selectedKnowledgePath,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
      })),
      topSelectedKnowledgePaths: pathGroups
        .filter((g) => g.selectedKnowledgePath != null)
        .map((g) => ({
          path: g.selectedKnowledgePath as string,
          feedbackCount: g._count._all,
        })),
    };
  }
}
