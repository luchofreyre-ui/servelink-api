import { Injectable } from "@nestjs/common";
import {
  BookingAuthorityReviewStatus,
  BookingAuthorityMismatchType,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { parseAuthorityStringArrayJson } from "./booking-authority-json.util";
import { BookingIntelligenceService } from "./booking-intelligence.service";

export type AuthorityTagBundle = {
  surfaces: string[];
  problems: string[];
  methods: string[];
  reasons: string[];
};

export type BookingAuthorityLearningActivityItem = {
  bookingId: string;
  status: BookingAuthorityReviewStatus;
  reviewMetadata: {
    reviewedByUserId: string | null;
    reviewedAt: string | null;
  };
  /**
   * When overridden: deterministic resolver output (pre-override signal is not stored).
   * Otherwise: tags persisted on the authority row.
   */
  originalTags: AuthorityTagBundle;
  /** Admin-persisted tags when status is overridden. */
  overrideTags: AuthorityTagBundle | null;
  mismatchType: BookingAuthorityMismatchType | null;
  mismatchNotes: string | null;
  updatedAt: string;
};

export type BookingAuthorityLearningActivityPayload = {
  kind: "booking_authority_learning_activity";
  windowUsed: { fromIso: string; toIso: string } | null;
  total: number;
  offset: number;
  limit: number;
  items: BookingAuthorityLearningActivityItem[];
};

function tagsFromRow(row: {
  surfacesJson: string;
  problemsJson: string;
  methodsJson: string;
  reasonsJson: string;
}): AuthorityTagBundle {
  return {
    surfaces: parseAuthorityStringArrayJson(row.surfacesJson),
    problems: parseAuthorityStringArrayJson(row.problemsJson),
    methods: parseAuthorityStringArrayJson(row.methodsJson),
    reasons: parseAuthorityStringArrayJson(row.reasonsJson),
  };
}

@Injectable()
export class BookingAuthorityLearningExportService {
  constructor(
    private readonly db: PrismaService,
    private readonly intelligence: BookingIntelligenceService,
  ) {}

  async buildLearningActivityDataset(options: {
    updatedAtGte?: Date;
    toIso: Date;
    skip: number;
    take: number;
  }): Promise<BookingAuthorityLearningActivityPayload> {
    const where =
      options.updatedAtGte != null
        ? { updatedAt: { gte: options.updatedAtGte } }
        : {};

    const [rows, total] = await Promise.all([
      this.db.bookingAuthorityResult.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: options.skip,
        take: options.take,
        include: {
          bookingAuthorityMismatches: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          booking: {
            select: {
              notes: true,
              estimateSnapshot: {
                select: { inputJson: true, outputJson: true },
              },
            },
          },
        },
      }),
      this.db.bookingAuthorityResult.count({ where }),
    ]);

    const items: BookingAuthorityLearningActivityItem[] = rows.map((row) => {
      const resolved = this.intelligence.resolveTags({
        notes: row.booking.notes,
        metadata: row.booking.estimateSnapshot
          ? {
              estimateInputJson: row.booking.estimateSnapshot.inputJson,
              estimateOutputJson: row.booking.estimateSnapshot.outputJson,
            }
          : null,
      });
      const resolverTags: AuthorityTagBundle = {
        surfaces: resolved.surfaces,
        problems: resolved.problems,
        methods: resolved.methods,
        reasons: resolved.reasons,
      };
      const persisted = tagsFromRow(row);
      const latest = row.bookingAuthorityMismatches[0];
      const originalTagsForExport =
        row.status === BookingAuthorityReviewStatus.overridden
          ? resolverTags
          : persisted;
      return {
        bookingId: row.bookingId,
        status: row.status,
        reviewMetadata: {
          reviewedByUserId: row.reviewedByUserId,
          reviewedAt: row.reviewedAt?.toISOString() ?? null,
        },
        originalTags: originalTagsForExport,
        overrideTags:
          row.status === BookingAuthorityReviewStatus.overridden
            ? persisted
            : null,
        mismatchType: latest?.mismatchType ?? null,
        mismatchNotes: latest?.notes ?? null,
        updatedAt: row.updatedAt.toISOString(),
      };
    });

    const windowUsed =
      options.updatedAtGte != null
        ? {
            fromIso: options.updatedAtGte.toISOString(),
            toIso: options.toIso.toISOString(),
          }
        : null;

    return {
      kind: "booking_authority_learning_activity",
      windowUsed,
      total,
      offset: options.skip,
      limit: options.take,
      items,
    };
  }
}
